const { db } = require("../../config/database")
const ItemCompraModel = require("./itemCompraModel")

class CompraModel {
  static async criar(compra) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO compra (fornecedor_id, usuario_id, data_compra, valor_total, status) 
                VALUES (?, ?, ?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        compra.fornecedor_id,
        compra.usuario_id,
        compra.data_compra,
        compra.valor_total,
        compra.status || "pendente",
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
      SELECT c.*, 
             p.nome as fornecedor_nome,
             cont.email as usuario_email
      FROM compra c
      LEFT JOIN fornecedor f ON c.fornecedor_id = f.fornecedor_id
      LEFT JOIN pessoa p ON f.pessoa_id = p.pessoa_id
      LEFT JOIN usuario u ON c.usuario_id = u.usuario_id
      LEFT JOIN pessoa pu ON u.pessoa_id = pu.pessoa_id
      LEFT JOIN contato cont ON pu.contato_id = cont.contato_id
      WHERE c.compra_id = ?
    `
    const [rows] = await db.execute(query, [id])

    if (rows.length === 0) {
      return null
    }

    const compra = rows[0]

    // Buscar itens da compra
    compra.itens = await ItemCompraModel.buscarPorCompraId(id)

    return compra
  }

  static async buscarTodos(filtros = {}) {
    let query = `
            SELECT c.*, 
                   p.nome as fornecedor_nome,
                   u.email as usuario_email
            FROM compra c
            LEFT JOIN fornecedor f ON c.fornecedor_id = f.fornecedor_id
            LEFT JOIN pessoa p ON f.pessoa_id = p.pessoa_id
            LEFT JOIN usuario u ON c.usuario_id = u.usuario_id
            WHERE 1=1
        `
    const params = []

    if (filtros.fornecedor_id) {
      query += " AND c.fornecedor_id = ?"
      params.push(filtros.fornecedor_id)
    }

    if (filtros.status) {
      query += " AND c.status = ?"
      params.push(filtros.status)
    }

    if (filtros.data_inicio) {
      query += " AND c.data_compra >= ?"
      params.push(filtros.data_inicio)
    }

    if (filtros.data_fim) {
      query += " AND c.data_compra <= ?"
      params.push(filtros.data_fim)
    }

    query += " ORDER BY c.data_criacao DESC"

    const [rows] = await db.execute(query, params)
    return rows
  }

  static async atualizar(id, compra) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                UPDATE compra 
                SET fornecedor_id = ?, data_compra = ?, valor_total = ?, status = ?
                WHERE compra_id = ?
            `
      const [result] = await connection.execute(query, [
        compra.fornecedor_id,
        compra.data_compra,
        compra.valor_total,
        compra.status,
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

  static async atualizarStatus(id, status) {
    const query = "UPDATE compra SET status = ? WHERE compra_id = ?"
    const [result] = await db.execute(query, [status, id])
    return result.affectedRows > 0
  }
}

module.exports = CompraModel
