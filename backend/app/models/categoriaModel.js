const db = require("../../config/database")

class CategoriaModel {
  static async criar(categoria) {
    const query = `
            INSERT INTO categoria (nome, descricao, status) 
            VALUES (?, ?, ?)
        `
    const [result] = await db.execute(query, [
      categoria.nome,
      categoria.descricao || null,
      categoria.status !== undefined ? categoria.status : true,
    ])
    return result.insertId
  }

  static async buscarPorId(id) {
    const query = "SELECT * FROM categoria WHERE categoria_id = ?"
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = "SELECT * FROM categoria"
    if (!incluirInativos) {
      query += " WHERE status = true"
    }
    query += " ORDER BY nome"
    const [rows] = await db.execute(query)
    return rows
  }

  static async atualizar(id, categoria) {
    const query = `
            UPDATE categoria 
            SET nome = ?, descricao = ?, status = ?
            WHERE categoria_id = ?
        `
    const [result] = await db.execute(query, [categoria.nome, categoria.descricao, categoria.status, id])
    return result.affectedRows > 0
  }

  static async inativar(id) {
    const query = "UPDATE categoria SET status = false WHERE categoria_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async buscarPorNome(nome) {
    const query = "SELECT * FROM categoria WHERE nome = ?"
    const [rows] = await db.execute(query, [nome])
    return rows[0]
  }
}

module.exports = CategoriaModel
