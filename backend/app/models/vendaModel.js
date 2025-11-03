const { db } = require("../../config/database")

class VendaModel {
  static async criar(venda) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO venda (cliente_id, usuario_id, forma_pagamento_id, data_hora, 
                                 valor_total, desconto_aplicado, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        venda.cliente_id,
        venda.usuario_id,
        venda.forma_pagamento_id,
        venda.data_hora || new Date(),
        venda.valor_total,
        venda.desconto_aplicado || 0,
        venda.status || "pendente",
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
            SELECT v.*, 
                   c.cpf as cliente_cpf,
                   pc.nome as cliente_nome,
                   fp.nome as forma_pagamento_nome,
                   u.email as usuario_email,
                   pu.nome as usuario_nome
            FROM venda v
            LEFT JOIN cliente c ON v.cliente_id = c.cliente_id
            LEFT JOIN pessoa pc ON c.pessoa_id = pc.pessoa_id
            LEFT JOIN forma_pagamento fp ON v.forma_pagamento_id = fp.forma_pagamento_id
            LEFT JOIN usuario u ON v.usuario_id = u.usuario_id
            LEFT JOIN pessoa pu ON u.pessoa_id = pu.pessoa_id
            WHERE v.venda_id = ?
        `
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(filtros = {}) {
    try {
      console.log(" VendaModel.buscarTodos - Filtros:", filtros)

      let query = `
            SELECT v.*, 
                   c.cpf as cliente_cpf,
                   pc.nome as cliente_nome,
                   fp.nome as forma_pagamento_nome,
                   u.email as usuario_email,
                   pu.nome as usuario_nome
            FROM venda v
            LEFT JOIN cliente c ON v.cliente_id = c.cliente_id
            LEFT JOIN pessoa pc ON c.pessoa_id = pc.pessoa_id
            LEFT JOIN forma_pagamento fp ON v.forma_pagamento_id = fp.forma_pagamento_id
            LEFT JOIN usuario u ON v.usuario_id = u.usuario_id
            LEFT JOIN pessoa pu ON u.pessoa_id = pu.pessoa_id
            WHERE 1=1
        `
      const params = []

      if (filtros.cliente_id) {
        query += " AND v.cliente_id = ?"
        params.push(filtros.cliente_id)
      }

      if (filtros.status) {
        query += " AND v.status = ?"
        params.push(filtros.status)
      }

      if (filtros.forma_pagamento_id) {
        query += " AND v.forma_pagamento_id = ?"
        params.push(filtros.forma_pagamento_id)
      }

      if (filtros.data_inicio) {
        query += " AND DATE(v.data_hora) >= ?"
        params.push(filtros.data_inicio)
      }

      if (filtros.data_fim) {
        query += " AND DATE(v.data_hora) <= ?"
        params.push(filtros.data_fim)
      }

      query += " ORDER BY v.data_hora DESC"

      console.log(" VendaModel.buscarTodos - Query:", query)
      console.log(" VendaModel.buscarTodos - Params:", params)

      const [rows] = await db.execute(query, params)

      console.log(" VendaModel.buscarTodos - Rows encontradas:", rows.length)

      return rows
    } catch (error) {
      console.error(" Erro em VendaModel.buscarTodos:", error)
      console.error(" Stack trace:", error.stack)
      throw error
    }
  }

  static async atualizar(id, venda) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                UPDATE venda 
                SET cliente_id = ?, forma_pagamento_id = ?, valor_total = ?, 
                    desconto_aplicado = ?, status = ?
                WHERE venda_id = ?
            `
      const [result] = await connection.execute(query, [
        venda.cliente_id,
        venda.forma_pagamento_id,
        venda.valor_total,
        venda.desconto_aplicado,
        venda.status,
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
    const query = "UPDATE venda SET status = ? WHERE venda_id = ?"
    const [result] = await db.execute(query, [status, id])
    return result.affectedRows > 0
  }
}

module.exports = VendaModel
