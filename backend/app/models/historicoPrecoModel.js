const { db } = require("../../config/database")

class HistoricoPrecoModel {
  static async criar(dados) {
    const { peca_id, fornecedor_id, compra_id, preco_compra } = dados

    const query = `
      INSERT INTO historico_precos (peca_id, fornecedor_id, compra_id, preco_compra)
      VALUES (?, ?, ?, ?)
    `

    const [result] = await db.execute(query, [peca_id, fornecedor_id, compra_id, preco_compra])
    return result.insertId
  }

  static async buscarPorPeca(pecaId) {
    const query = `
      SELECT 
        hp.*,
        f.nome as fornecedor_nome,
        c.data_compra
      FROM historico_precos hp
      LEFT JOIN fornecedores f ON hp.fornecedor_id = f.fornecedor_id
      LEFT JOIN compras c ON hp.compra_id = c.compra_id
      WHERE hp.peca_id = ?
      ORDER BY hp.data_registro DESC
    `

    const [rows] = await db.execute(query, [pecaId])
    return rows
  }

  static async buscarPorPecaEFornecedor(pecaId, fornecedorId) {
    const query = `
      SELECT 
        hp.*,
        f.nome as fornecedor_nome,
        c.data_compra
      FROM historico_precos hp
      LEFT JOIN fornecedores f ON hp.fornecedor_id = f.fornecedor_id
      LEFT JOIN compras c ON hp.compra_id = c.compra_id
      WHERE hp.peca_id = ? AND hp.fornecedor_id = ?
      ORDER BY hp.data_registro DESC
    `

    const [rows] = await db.execute(query, [pecaId, fornecedorId])
    return rows
  }

  static async buscarUltimoPreco(pecaId, fornecedorId) {
    const query = `
      SELECT preco_compra, data_registro
      FROM historico_precos
      WHERE peca_id = ? AND fornecedor_id = ?
      ORDER BY data_registro DESC
      LIMIT 1
    `

    const [rows] = await db.execute(query, [pecaId, fornecedorId])
    return rows[0] || null
  }

  static async buscarMelhorPreco(pecaId) {
    const query = `
      SELECT 
        hp.fornecedor_id,
        f.nome as fornecedor_nome,
        MIN(hp.preco_compra) as melhor_preco,
        MAX(hp.data_registro) as ultima_compra
      FROM historico_precos hp
      LEFT JOIN fornecedores f ON hp.fornecedor_id = f.fornecedor_id
      WHERE hp.peca_id = ?
      GROUP BY hp.fornecedor_id, f.nome
      ORDER BY melhor_preco ASC
      LIMIT 5
    `

    const [rows] = await db.execute(query, [pecaId])
    return rows
  }

  static async buscarEstatisticas(pecaId) {
    const query = `
      SELECT 
        COUNT(*) as total_compras,
        MIN(preco_compra) as preco_minimo,
        MAX(preco_compra) as preco_maximo,
        AVG(preco_compra) as preco_medio,
        MIN(data_registro) as primeira_compra,
        MAX(data_registro) as ultima_compra
      FROM historico_precos
      WHERE peca_id = ?
    `

    const [rows] = await db.execute(query, [pecaId])
    return rows[0] || null
  }
}

module.exports = HistoricoPrecoModel
