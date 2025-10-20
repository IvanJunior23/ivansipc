const { pool } = require("../../config/database")

class AlertaModel {
  // Buscar alertas de estoque baixo
  static async getEstoqueBaixo() {
    const query = `
      SELECT p.peca_id, p.nome, p.quantidade_estoque, p.quantidade_minima,
             c.nome as categoria_nome, m.nome as marca_nome
      FROM peca p
      LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
      LEFT JOIN marca m ON p.marca_id = m.marca_id
      WHERE p.quantidade_estoque <= p.quantidade_minima
      ORDER BY (p.quantidade_estoque - p.quantidade_minima) ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
      throw new Error(`Erro ao buscar alertas de estoque baixo: ${error.message}`)
    }
  }

  // Buscar vendas pendentes (se houver status pendente)
  static async getVendasPendentes() {
    const query = `
      SELECT v.venda_id, v.data_hora, v.valor_total, v.status,
             c.nome_completo as cliente_nome, u.email as vendedor_email
      FROM venda v
      LEFT JOIN cliente cl ON v.cliente_id = cl.cliente_id
      LEFT JOIN contato c ON cl.contato_id = c.contato_id
      LEFT JOIN usuario u ON v.usuario_id = u.usuario_id
      WHERE v.status = 'pendente'
      ORDER BY v.data_hora ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
      throw new Error(`Erro ao buscar vendas pendentes: ${error.message}`)
    }
  }

  // Buscar compras pendentes
  static async getComprasPendentes() {
    const query = `
      SELECT c.compra_id, c.data_compra, c.valor_total, c.status,
             f.nome as fornecedor_nome, u.email as usuario_email
      FROM compra c
      LEFT JOIN fornecedor fo ON c.fornecedor_id = fo.fornecedor_id
      LEFT JOIN pessoa f ON fo.pessoa_id = f.pessoa_id
      LEFT JOIN usuario u ON c.usuario_id = u.usuario_id
      WHERE c.status = 'pendente'
      ORDER BY c.data_compra ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
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
      throw new Error(`Erro ao contar alertas: ${error.message}`)
    }
  }

  static async buscarPorId(id) {
    const query = `
      SELECT * FROM alerta WHERE alerta_id = ?
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
      UPDATE alerta 
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
      UPDATE alerta 
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
