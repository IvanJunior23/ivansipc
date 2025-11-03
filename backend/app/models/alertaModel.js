const { pool } = require("../../config/database")

class AlertaModel {
  // Buscar alertas de estoque baixo
  static async getEstoqueBaixo() {
    const query = `
      SELECT 
        p.peca_id, 
        p.codigo,
        p.nome, 
        p.descricao, 
        p.quantidade_estoque, 
        p.quantidade_minima,
        c.nome as categoria_nome, 
        m.nome as marca_nome
      FROM peca p
      LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
      LEFT JOIN marca m ON p.marca_id = m.marca_id
      WHERE p.quantidade_estoque <= p.quantidade_minima 
        AND p.status = TRUE
      ORDER BY (p.quantidade_estoque - p.quantidade_minima) ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
      console.error(" Erro em getEstoqueBaixo:", error.message)
      throw new Error(`Erro ao buscar alertas de estoque baixo: ${error.message}`)
    }
  }

  static async getAlertasRecompra() {
    const query = `
      SELECT 
        p.peca_id,
        p.codigo,
        p.nome,
        p.descricao,
        p.quantidade_estoque,
        p.quantidade_minima,
        p.preco_custo,
        p.fornecedor_id,
        c.nome as categoria_nome,
        m.nome as marca_nome,
        (p.quantidade_minima * 2 - p.quantidade_estoque) as quantidade_sugerida
      FROM peca p
      LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
      LEFT JOIN marca m ON p.marca_id = m.marca_id
      WHERE p.quantidade_estoque <= p.quantidade_minima
        AND p.status = TRUE
      ORDER BY 
        CASE 
          WHEN p.quantidade_estoque = 0 THEN 1
          ELSE 2
        END,
        (p.quantidade_estoque - p.quantidade_minima) ASC
    `

    try {
      const [results] = await pool.execute(query)

      const enrichedResults = await Promise.all(
        results.map(async (peca) => {
          // Buscar fornecedor preferencial
          let fornecedorInfo = null
          if (peca.fornecedor_id) {
            try {
              const [fornecedor] = await pool.execute(
                `SELECT f.fornecedor_id, p.nome as fornecedor_nome, c.telefone, c.email
                 FROM fornecedor f
                 LEFT JOIN pessoa p ON f.pessoa_id = p.pessoa_id
                 LEFT JOIN contato c ON f.contato_id = c.contato_id
                 WHERE f.fornecedor_id = ?`,
                [peca.fornecedor_id],
              )
              fornecedorInfo = fornecedor[0] || null
            } catch (err) {
              console.error(" Erro ao buscar fornecedor:", err.message)
            }
          }

          let ultimaCompraInfo = null
          try {
            const [ultimaCompra] = await pool.execute(
              `SELECT ic.valor_unitario as ultimo_preco, co.data_compra as data_ultima_compra
               FROM item_compra ic
               JOIN compra co ON ic.compra_id = co.compra_id
               WHERE ic.peca_id = ?
               ORDER BY co.data_compra DESC
               LIMIT 1`,
              [peca.peca_id],
            )
            ultimaCompraInfo = ultimaCompra[0] || null
          } catch (err) {
            console.error(" Erro ao buscar última compra:", err.message)
          }

          return {
            ...peca,
            fornecedor_preferencial: fornecedorInfo?.fornecedor_nome || null,
            fornecedor_telefone: fornecedorInfo?.telefone || null,
            fornecedor_email: fornecedorInfo?.email || null,
            ultimo_preco: ultimaCompraInfo?.ultimo_preco || peca.preco_custo,
            data_ultima_compra: ultimaCompraInfo?.data_ultima_compra || null,
          }
        }),
      )

      return enrichedResults
    } catch (error) {
      console.error(" Erro em getAlertasRecompra:", error.message)
      throw new Error(`Erro ao buscar alertas de recompra: ${error.message}`)
    }
  }

  static async getVendasPendentes() {
    const query = `
      SELECT 
        v.venda_id, 
        v.data_hora, 
        v.valor_total, 
        v.status,
        p.nome as cliente_nome, 
        u.email as vendedor_email
      FROM venda v
      LEFT JOIN cliente cl ON v.cliente_id = cl.cliente_id
      LEFT JOIN pessoa p ON cl.pessoa_id = p.pessoa_id
      LEFT JOIN usuario u ON v.usuario_id = u.usuario_id
      WHERE v.status = 'pendente'
      ORDER BY v.data_hora ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
      console.error(" Erro em getVendasPendentes:", error.message)
      throw new Error(`Erro ao buscar vendas pendentes: ${error.message}`)
    }
  }

  static async getComprasPendentes() {
    const query = `
      SELECT 
        c.compra_id, 
        c.data_compra, 
        c.valor_total, 
        c.status,
        pf.nome as fornecedor_nome, 
        u.email as usuario_email
      FROM compra c
      LEFT JOIN fornecedor f ON c.fornecedor_id = f.fornecedor_id
      LEFT JOIN pessoa pf ON f.pessoa_id = pf.pessoa_id
      LEFT JOIN usuario u ON c.usuario_id = u.usuario_id
      WHERE c.status = 'pendente'
      ORDER BY c.data_compra ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
      console.error(" Erro em getComprasPendentes:", error.message)
      throw new Error(`Erro ao buscar compras pendentes: ${error.message}`)
    }
  }

  // Contar total de alertas
  static async getTotalAlertas() {
    try {
      const estoqueBaixo = await this.getEstoqueBaixo()
      const vendasPendentes = await this.getVendasPendentes()
      const comprasPendentes = await this.getComprasPendentes()

      return {
        estoque_baixo: estoqueBaixo.length,
        vendas_pendentes: vendasPendentes.length,
        compras_pendentes: comprasPendentes.length,
        total: estoqueBaixo.length + vendasPendentes.length + comprasPendentes.length,
      }
    } catch (error) {
      console.error(" Erro em getTotalAlertas:", error.message)
      throw new Error(`Erro ao contar alertas: ${error.message}`)
    }
  }

  static async buscarPorId(id) {
    const query = `
      SELECT * FROM alertas WHERE alerta_id = ?
    `
    try {
      const [results] = await pool.execute(query, [id])
      return results[0]
    } catch (error) {
      throw new Error(`Erro ao buscar alerta: ${error.message}`)
    }
  }

  static async resolver(alertaId, usuarioId) {
    const query = `
      UPDATE alertas 
      SET status = 'Resolvido', 
          usuario_responsavel_id = ?,
          data_hora_resolucao = NOW()
      WHERE alerta_id = ?
    `
    try {
      const [result] = await pool.execute(query, [usuarioId, alertaId])
      return result.affectedRows > 0
    } catch (error) {
      throw new Error(`Erro ao resolver alerta: ${error.message}`)
    }
  }

  static async dispensar(alertaId, usuarioId) {
    const query = `
      UPDATE alertas 
      SET status = 'Dispensado', 
          usuario_responsavel_id = ?,
          data_hora_resolucao = NOW()
      WHERE alerta_id = ?
    `
    try {
      const [result] = await pool.execute(query, [usuarioId, alertaId])
      return result.affectedRows > 0
    } catch (error) {
      throw new Error(`Erro ao dispensar alerta: ${error.message}`)
    }
  }
}

module.exports = AlertaModel
