const { db } = require("../../config/database")

class ClienteModel {
  static async criar(cliente) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO cliente (pessoa_id, cpf, status) 
                VALUES (?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        cliente.pessoa_id,
        cliente.cpf,
        cliente.status !== undefined ? cliente.status : true,
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
            SELECT c.*, p.nome, p.status as pessoa_status,
                   ct.nome_completo, ct.telefone, ct.email,
                   e.logradouro, e.numero, e.complemento, e.bairro, 
                   e.cidade, e.estado, e.cep
            FROM cliente c
            INNER JOIN pessoa p ON c.pessoa_id = p.pessoa_id
            LEFT JOIN contato ct ON p.contato_id = ct.contato_id
            LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
            WHERE c.cliente_id = ?
        `
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = `
            SELECT c.*, p.nome, p.status as pessoa_status,
                   ct.nome_completo, ct.telefone, ct.email,
                   e.logradouro, e.numero, e.complemento, e.bairro, 
                   e.cidade, e.estado, e.cep
            FROM cliente c
            INNER JOIN pessoa p ON c.pessoa_id = p.pessoa_id
            LEFT JOIN contato ct ON p.contato_id = ct.contato_id
            LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
        `
    if (!incluirInativos) {
      query += " WHERE c.status = true AND p.status = true"
    }
    query += " ORDER BY p.nome"

    const [rows] = await db.execute(query)
    return rows
  }

  static async atualizar(id, cliente) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                UPDATE cliente 
                SET cpf = ?, status = ?
                WHERE cliente_id = ?
            `
      const [result] = await connection.execute(query, [cliente.cpf, cliente.status, id])

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
    const query = "UPDATE cliente SET status = false WHERE cliente_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async ativar(id) {
    const query = "UPDATE cliente SET status = true WHERE cliente_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async toggleStatus(id, status) {
    const query = "UPDATE cliente SET status = ? WHERE cliente_id = ?"
    const [result] = await db.execute(query, [status, id])
    return result.affectedRows > 0
  }

  static async buscarPorCpf(cpf) {
    const query = "SELECT * FROM cliente WHERE cpf = ?"
    const [rows] = await db.execute(query, [cpf])
    return rows[0]
  }

  static async buscarPorPessoaId(pessoaId) {
    const query = "SELECT * FROM cliente WHERE pessoa_id = ?"
    const [rows] = await db.execute(query, [pessoaId])
    return rows[0]
  }
}

module.exports = ClienteModel
