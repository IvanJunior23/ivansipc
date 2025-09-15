const db = require("../../config/database")

class FornecedorModel {
  static async criar(fornecedor) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO fornecedor (pessoa_id, cnpj, status) 
                VALUES (?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        fornecedor.pessoa_id,
        fornecedor.cnpj,
        fornecedor.status !== undefined ? fornecedor.status : true,
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
            SELECT f.*, p.nome, p.status as pessoa_status,
                   ct.nome_completo, ct.telefone, ct.email,
                   e.logradouro, e.numero, e.complemento, e.bairro, 
                   e.cidade, e.estado, e.cep
            FROM fornecedor f
            INNER JOIN pessoa p ON f.pessoa_id = p.pessoa_id
            LEFT JOIN contato ct ON p.contato_id = ct.contato_id
            LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
            WHERE f.fornecedor_id = ?
        `
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = `
            SELECT f.*, p.nome, p.status as pessoa_status,
                   ct.nome_completo, ct.telefone, ct.email,
                   e.logradouro, e.numero, e.complemento, e.bairro, 
                   e.cidade, e.estado, e.cep
            FROM fornecedor f
            INNER JOIN pessoa p ON f.pessoa_id = p.pessoa_id
            LEFT JOIN contato ct ON p.contato_id = ct.contato_id
            LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
        `
    if (!incluirInativos) {
      query += " WHERE f.status = true AND p.status = true"
    }
    query += " ORDER BY p.nome"

    const [rows] = await db.execute(query)
    return rows
  }

  static async atualizar(id, fornecedor) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                UPDATE fornecedor 
                SET cnpj = ?, status = ?
                WHERE fornecedor_id = ?
            `
      const [result] = await connection.execute(query, [fornecedor.cnpj, fornecedor.status, id])

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
    const query = "UPDATE fornecedor SET status = false WHERE fornecedor_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async buscarPorCnpj(cnpj) {
    const query = "SELECT * FROM fornecedor WHERE cnpj = ?"
    const [rows] = await db.execute(query, [cnpj])
    return rows[0]
  }
}

module.exports = FornecedorModel
