const db = require("../../config/database")

class ImagemModel {
  static async criar(imagem) {
    const query = `
            INSERT INTO imagem (referencia_url, descricao, status) 
            VALUES (?, ?, ?)
        `
    const [result] = await db.execute(query, [
      imagem.referencia_url,
      imagem.descricao || null,
      imagem.status !== undefined ? imagem.status : true,
    ])
    return result.insertId
  }

  static async buscarPorId(id) {
    const query = "SELECT * FROM imagem WHERE imagem_id = ?"
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = "SELECT * FROM imagem"
    if (!incluirInativos) {
      query += " WHERE status = true"
    }
    query += " ORDER BY imagem_id DESC"
    const [rows] = await db.execute(query)
    return rows
  }

  static async atualizar(id, imagem) {
    const query = `
            UPDATE imagem 
            SET referencia_url = ?, descricao = ?, status = ?
            WHERE imagem_id = ?
        `
    const [result] = await db.execute(query, [imagem.referencia_url, imagem.descricao, imagem.status, id])
    return result.affectedRows > 0
  }

  static async inativar(id) {
    const query = "UPDATE imagem SET status = false WHERE imagem_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async deletar(id) {
    const query = "DELETE FROM imagem WHERE imagem_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }
}

module.exports = ImagemModel
