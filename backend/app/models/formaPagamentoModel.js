const db = require("../../config/database")

class FormaPagamentoModel {
  static async criar(formaPagamento) {
    const query = `
            INSERT INTO forma_pagamento (nome, descricao, status) 
            VALUES (?, ?, ?)
        `
    const [result] = await db.execute(query, [
      formaPagamento.nome,
      formaPagamento.descricao || null,
      formaPagamento.status !== undefined ? formaPagamento.status : true,
    ])
    return result.insertId
  }

  static async buscarPorId(id) {
    const query = "SELECT * FROM forma_pagamento WHERE forma_pagamento_id = ?"
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = "SELECT * FROM forma_pagamento"
    if (!incluirInativos) {
      query += " WHERE status = true"
    }
    query += " ORDER BY nome"
    const [rows] = await db.execute(query)
    return rows
  }

  static async atualizar(id, formaPagamento) {
    const query = `
            UPDATE forma_pagamento 
            SET nome = ?, descricao = ?, status = ?
            WHERE forma_pagamento_id = ?
        `
    const [result] = await db.execute(query, [formaPagamento.nome, formaPagamento.descricao, formaPagamento.status, id])
    return result.affectedRows > 0
  }

  static async inativar(id) {
    const query = "UPDATE forma_pagamento SET status = false WHERE forma_pagamento_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async buscarPorNome(nome) {
    const query = "SELECT * FROM forma_pagamento WHERE nome = ?"
    const [rows] = await db.execute(query, [nome])
    return rows[0]
  }
}

module.exports = FormaPagamentoModel
