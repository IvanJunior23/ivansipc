const { db } = require("../../config/database")

class UsuarioModel {
  static async criar(usuario) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
        INSERT INTO usuario (pessoa_id, email, senha, tipo_usuario, status) 
        VALUES (?, ?, ?, ?, ?)
      `
      const [result] = await connection.execute(query, [
        usuario.pessoa_id,
        usuario.email,
        usuario.senha,
        usuario.tipo_usuario,
        usuario.status !== undefined ? usuario.status : true,
      ])

      await connection.commit()
      return result.insertId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async buscarPorId(id) {
    const query = `
      SELECT u.*, p.nome, p.status as pessoa_status,
             ct.nome_completo, ct.telefone, ct.email as contato_email,
             e.logradouro, e.numero, e.complemento, e.bairro, 
             e.cidade, e.estado, e.cep
      FROM usuario u
      INNER JOIN pessoa p ON u.pessoa_id = p.pessoa_id
      LEFT JOIN contato ct ON p.contato_id = ct.contato_id
      LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
      WHERE u.usuario_id = ?
    `
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = `
      SELECT u.*, p.nome, p.status as pessoa_status,
             ct.nome_completo, ct.telefone, ct.email as contato_email,
             e.logradouro, e.numero, e.complemento, e.bairro, 
             e.cidade, e.estado, e.cep
      FROM usuario u
      INNER JOIN pessoa p ON u.pessoa_id = p.pessoa_id
      LEFT JOIN contato ct ON p.contato_id = ct.contato_id
      LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
    `
    if (!incluirInativos) {
      query += " WHERE u.status = true AND p.status = true"
    }
    query += " ORDER BY p.nome"

    const [rows] = await db.execute(query)
    return rows
  }

  static async atualizar(id, usuario) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
        UPDATE usuario 
        SET email = ?, tipo_usuario = ?, status = ?
        WHERE usuario_id = ?
      `
      const [result] = await connection.execute(query, [usuario.email, usuario.tipo_usuario, usuario.status, id])

      await connection.commit()
      return result.affectedRows > 0
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async atualizarSenha(id, senhaHash) {
    const query = `
      UPDATE usuario 
      SET senha = ?
      WHERE usuario_id = ?
    `
    const [result] = await db.execute(query, [senhaHash, id])
    return result.affectedRows > 0
  }

  static async inativar(id) {
    const query = "UPDATE usuario SET status = false WHERE usuario_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async ativar(id) {
    const query = "UPDATE usuario SET status = true WHERE usuario_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async toggleStatus(id, status) {
    const query = "UPDATE usuario SET status = ? WHERE usuario_id = ?"
    const [result] = await db.execute(query, [status, id])
    return result.affectedRows > 0
  }

  static async buscarPorEmail(email) {
    const query = "SELECT * FROM usuario WHERE email = ?"
    const [rows] = await db.execute(query, [email])
    return rows[0]
  }

  static async buscarPorPessoaId(pessoaId) {
    const query = "SELECT * FROM usuario WHERE pessoa_id = ?"
    const [rows] = await db.execute(query, [pessoaId])
    return rows[0]
  }
}

module.exports = UsuarioModel
