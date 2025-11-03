const { pool } = require("../../config/database")

class RelatorioModel {
  // Relatório de estoque
  static async getRelatorioEstoque(filtros = {}) {
    let query = `
      SELECT p.peca_id, p.nome, p.descricao, p.quantidade_estoque, p.quantidade_minima,
             p.preco_custo, p.preco_venda, p.condicao,
             c.nome as categoria_nome, m.nome as marca_nome,
             (p.quantidade_estoque * p.preco_custo) as valor_estoque
      FROM peca p
      LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
      LEFT JOIN marca m ON p.marca_id = m.marca_id
      WHERE 1=1
    `

    const params = []

    if (filtros.categoria_id) {
      query += " AND p.categoria_id = ?"
      params.push(filtros.categoria_id)
    }

    if (filtros.marca_id) {
      query += " AND p.marca_id = ?"
      params.push(filtros.marca_id)
    }

    if (filtros.estoque_baixo) {
      query += " AND p.quantidade_estoque <= p.quantidade_minima"
    }

    query += " ORDER BY p.nome"

    try {
      const [results] = await pool.execute(query, params)
      return results
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de estoque: ${error.message}`)
    }
  }

  // Relatório de vendas
  static async getRelatorioVendas(filtros = {}) {
    let query = `
      SELECT v.venda_id, v.data_hora, v.valor_total, v.desconto_aplicado, v.status,
             c.nome_completo as cliente_nome, fp.nome as forma_pagamento,
             u.email as vendedor_email,
             COUNT(iv.item_venda_id) as total_itens
      FROM venda v
      LEFT JOIN cliente cl ON v.cliente_id = cl.cliente_id
      LEFT JOIN contato c ON cl.contato_id = c.contato_id
      LEFT JOIN forma_pagamento fp ON v.forma_pagamento_id = fp.forma_pagamento_id
      LEFT JOIN usuario u ON v.usuario_id = u.usuario_id
      LEFT JOIN item_venda iv ON v.venda_id = iv.venda_id
      WHERE 1=1
    `

    const params = []

    if (filtros.data_inicio) {
      query += " AND DATE(v.data_hora) >= ?"
      params.push(filtros.data_inicio)
    }

    if (filtros.data_fim) {
      query += " AND DATE(v.data_hora) <= ?"
      params.push(filtros.data_fim)
    }

    if (filtros.cliente_id) {
      query += " AND v.cliente_id = ?"
      params.push(filtros.cliente_id)
    }

    if (filtros.status) {
      query += " AND v.status = ?"
      params.push(filtros.status)
    }

    query += " GROUP BY v.venda_id ORDER BY v.data_hora DESC"

    try {
      const [results] = await pool.execute(query, params)
      return results
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de vendas: ${error.message}`)
    }
  }

  // Resumo de vendas (dashboard)
  static async getResumoVendas(periodo = 30) {
    const query = `
      SELECT 
        COUNT(*) as total_vendas,
        SUM(valor_total) as valor_total_vendas,
        AVG(valor_total) as ticket_medio,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) as vendas_concluidas,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as vendas_canceladas
      FROM venda 
      WHERE data_hora >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `

    try {
      const [results] = await pool.execute(query, [periodo])
      return results[0] || {}
    } catch (error) {
      throw new Error(`Erro ao gerar resumo de vendas: ${error.message}`)
    }
  }

  // Produtos mais vendidos
  static async getProdutosMaisVendidos(limite = 10, periodo = 30) {
    const query = `
      SELECT p.peca_id, p.nome, p.preco_venda,
             SUM(iv.quantidade) as quantidade_vendida,
             SUM(iv.quantidade * iv.valor_unitario) as valor_total_vendido,
             COUNT(DISTINCT iv.venda_id) as numero_vendas
      FROM item_venda iv
      JOIN peca p ON iv.peca_id = p.peca_id
      JOIN venda v ON iv.venda_id = v.venda_id
      WHERE v.data_hora >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND v.status = 'concluida'
      GROUP BY p.peca_id, p.nome, p.preco_venda
      ORDER BY quantidade_vendida DESC
      LIMIT ?
    `

    try {
      const [results] = await pool.execute(query, [periodo, limite])
      return results
    } catch (error) {
      throw new Error(`Erro ao buscar produtos mais vendidos: ${error.message}`)
    }
  }

  // Relatório de estoque baixo
  static async getRelatorioEstoqueBaixo() {
    const query = `
      SELECT p.peca_id, p.nome, p.quantidade_estoque, p.quantidade_minima,
             (p.quantidade_minima - p.quantidade_estoque) as deficit,
             p.preco_custo, (p.quantidade_minima - p.quantidade_estoque) * p.preco_custo as valor_reposicao,
             c.nome as categoria_nome, m.nome as marca_nome
      FROM peca p
      LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
      LEFT JOIN marca m ON p.marca_id = m.marca_id
      WHERE p.quantidade_estoque <= p.quantidade_minima
      ORDER BY deficit DESC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de estoque baixo: ${error.message}`)
    }
  }

  // Vendas por período (gráfico)
  static async getVendasPorPeriodo(periodo = 30) {
    const query = `
      SELECT DATE(data_hora) as data,
             COUNT(*) as total_vendas,
             SUM(valor_total) as valor_total
      FROM venda 
      WHERE data_hora >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status = 'concluida'
      GROUP BY DATE(data_hora)
      ORDER BY data ASC
    `

    try {
      const [results] = await pool.execute(query, [periodo])
      return results
    } catch (error) {
      throw new Error(`Erro ao buscar vendas por período: ${error.message}`)
    }
  }

  // Relatório de clientes
  static async getRelatorioClientes(filtros = {}) {
    let query = `
      SELECT 
        p.pessoa_id,
        p.nome,
        p.tipo_pessoa,
        c.cliente_id,
        c.status as ativo,
        COUNT(DISTINCT v.venda_id) as total_compras,
        COALESCE(SUM(v.valor_total), 0) as valor_total,
        MAX(v.data_hora) as ultima_compra
      FROM cliente c
      JOIN pessoa p ON c.pessoa_id = p.pessoa_id
      LEFT JOIN venda v ON c.cliente_id = v.cliente_id AND v.status = 'concluida'
      WHERE 1=1
    `

    const params = []

    if (filtros.ativo !== undefined) {
      query += " AND c.status = ?"
      params.push(filtros.ativo)
    }

    if (filtros.data_inicio && filtros.data_fim) {
      query += " AND v.data_hora BETWEEN ? AND ?"
      params.push(filtros.data_inicio, filtros.data_fim)
    }

    query += " GROUP BY p.pessoa_id, p.nome, p.tipo_pessoa, c.cliente_id, c.status"
    query += " ORDER BY valor_total DESC"

    try {
      const [results] = await pool.execute(query, params)
      return results
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de clientes: ${error.message}`)
    }
  }

  // Relatório financeiro
  static async getRelatorioFinanceiro(filtros = {}) {
    let query = `
      SELECT 
        DATE_FORMAT(v.data_hora, '%Y-%m') as periodo,
        SUM(v.valor_total) as receita,
        SUM(iv.quantidade * p.preco_custo) as custos,
        SUM(v.valor_total) - SUM(iv.quantidade * p.preco_custo) as lucro_bruto,
        ((SUM(v.valor_total) - SUM(iv.quantidade * p.preco_custo)) / SUM(v.valor_total) * 100) as margem
      FROM venda v
      JOIN item_venda iv ON v.venda_id = iv.venda_id
      JOIN peca p ON iv.peca_id = p.peca_id
      WHERE v.status = 'concluida'
    `

    const params = []

    if (filtros.data_inicio && filtros.data_fim) {
      query += " AND DATE(v.data_hora) BETWEEN ? AND ?"
      params.push(filtros.data_inicio, filtros.data_fim)
    } else {
      query += " AND v.data_hora >= DATE_SUB(NOW(), INTERVAL 12 MONTH)"
    }

    query += " GROUP BY DATE_FORMAT(v.data_hora, '%Y-%m')"
    query += " ORDER BY periodo DESC"

    try {
      const [results] = await pool.execute(query, params)
      return results
    } catch (error) {
      throw new Error(`Erro ao gerar relatório financeiro: ${error.message}`)
    }
  }
}

module.exports = RelatorioModel
