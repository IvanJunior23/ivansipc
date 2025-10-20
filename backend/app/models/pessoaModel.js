const { pool } = require("../../config/database")

class PessoaModel {
  static async criar(pessoa) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const query = `
        INSERT INTO pessoa (nome, contato_id, endereco_id, status)
        VALUES (?, ?, ?, ?)
      `
      const [result] = await connection.execute(query, [
        pessoa.nome,
        pessoa.contato_id || null,
        pessoa.endereco_id || null,
        pessoa.status !== undefined ? pessoa.status : true,
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
      SELECT p.*,
             c.nome_completo, c.telefone, c.email,
             e.logradouro, e.numero, e.complemento, e.bairro,
             e.cidade, e.estado, e.cep
      FROM pessoa p
      LEFT JOIN contato c ON p.contato_id = c.contato_id
      LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
      WHERE p.pessoa_id = ?
    `
    const [rows] = await pool.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = `
      SELECT p.*,
             c.nome_completo, c.telefone, c.email,
             e.logradouro, e.numero, e.complemento, e.bairro,
             e.cidade, e.estado, e.cep
      FROM pessoa p
      LEFT JOIN contato c ON p.contato_id = c.contato_id
      LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
    `
    
    const params = []
    if (!incluirInativos) {
      query += " WHERE p.status = ?"
      params.push(true)
    }
    
    query += " ORDER BY p.nome"
    
    const [rows] = await pool.execute(query, params)
    return rows
  }

  static async atualizar(id, pessoa) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const query = `
        UPDATE pessoa
        SET nome = ?, contato_id = ?, endereco_id = ?, status = ?
        WHERE pessoa_id = ?
      `
      const [result] = await connection.execute(query, [
        pessoa.nome,
        pessoa.contato_id,
        pessoa.endereco_id,
        pessoa.status,
        id,
      ])
      await connection.commit()
      return result.affectedRows > 0
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async inativar(id) {
    const query = "UPDATE pessoa SET status = false WHERE pessoa_id = ?"
    const [result] = await pool.execute(query, [id])
    return result.affectedRows > 0
  }
}

module.exports = PessoaModel
