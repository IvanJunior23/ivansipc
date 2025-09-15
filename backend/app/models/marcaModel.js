const db = require("../../config/database")

class MarcaModel {
  static async criar(marca) {
    const query = `
            INSERT INTO marca (nome, descricao, status) 
            VALUES (?, ?, ?)
        `
    const [result] = await db.execute(query, [
      marca.nome,
      marca.descricao || null,
      marca.status !== undefined ? marca.status : true,
    ])
    return result.insertId
  }

  static async buscarPorId(id) {
    const query = "SELECT * FROM marca WHERE marca_id = ?"
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = "SELECT * FROM marca"
    if (!incluirInativos) {
      query += " WHERE status = true"
    }
    query += " ORDER BY nome"
    const [rows] = await db.execute(query)
    return rows
  }

  static async atualizar(id, marca) {
    const query = `
            UPDATE marca 
            SET nome = ?, descricao = ?, status = ?
            WHERE marca_id = ?
        `
    const [result] = await db.execute(query, [marca.nome, marca.descricao, marca.status, id])
    return result.affectedRows > 0
  }

  static async inativar(id) {
    const query = "UPDATE marca SET status = false WHERE marca_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async buscarPorNome(nome) {
    const query = "SELECT * FROM marca WHERE nome = ?"
    const [rows] = await db.execute(query, [nome])
    return rows[0]
  }
}

module.exports = MarcaModel
