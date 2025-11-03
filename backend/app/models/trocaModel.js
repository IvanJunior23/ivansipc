const { db } = require("../../config/database")

class TrocaModel {
  static async criar(troca) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO troca (venda_id, usuario_responsavel_id, peca_trocada_id, 
                                 peca_substituta_id, quantidade, data_troca, motivo_troca, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        troca.venda_id,
        troca.usuario_responsavel_id,
        troca.peca_trocada_id,
        troca.peca_substituta_id,
        troca.quantidade,
        troca.data_troca || new Date(),
        troca.motivo_troca,
        troca.status || "pendente",
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
            SELECT t.*, 
                   v.venda_id, v.data_hora as venda_data,
                   c.cliente_id,
                   pc.nome as cliente_nome,
                   pt.nome as peca_trocada_nome,
                   ps.nome as peca_substituta_nome,
                   u.email as usuario_email,
                   pu.nome as usuario_nome
            FROM troca t
            LEFT JOIN venda v ON t.venda_id = v.venda_id
            LEFT JOIN cliente c ON v.cliente_id = c.cliente_id
            LEFT JOIN pessoa pc ON c.pessoa_id = pc.pessoa_id
            LEFT JOIN peca pt ON t.peca_trocada_id = pt.peca_id
            LEFT JOIN peca ps ON t.peca_substituta_id = ps.peca_id
            LEFT JOIN usuario u ON t.usuario_responsavel_id = u.usuario_id
            LEFT JOIN pessoa pu ON u.pessoa_id = pu.pessoa_id
            WHERE t.troca_id = ?
        `
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(filtros = {}) {
    let query = `
            SELECT t.*, 
                   v.venda_id, v.data_hora as venda_data,
                   c.cliente_id,
                   pc.nome as cliente_nome,
                   pt.nome as peca_trocada_nome,
                   ps.nome as peca_substituta_nome,
                   u.email as usuario_email,
                   pu.nome as usuario_nome
            FROM troca t
            LEFT JOIN venda v ON t.venda_id = v.venda_id
            LEFT JOIN cliente c ON v.cliente_id = c.cliente_id
            LEFT JOIN pessoa pc ON c.pessoa_id = pc.pessoa_id
            LEFT JOIN peca pt ON t.peca_trocada_id = pt.peca_id
            LEFT JOIN peca ps ON t.peca_substituta_id = ps.peca_id
            LEFT JOIN usuario u ON t.usuario_responsavel_id = u.usuario_id
            LEFT JOIN pessoa pu ON u.pessoa_id = pu.pessoa_id
            WHERE 1=1
        `
    const params = []

    if (filtros.venda_id) {
      query += " AND t.venda_id = ?"
      params.push(filtros.venda_id)
    }

    if (filtros.status) {
      query += " AND t.status = ?"
      params.push(filtros.status)
    }

    if (filtros.data_inicio) {
      query += " AND DATE(t.data_troca) >= ?"
      params.push(filtros.data_inicio)
    }

    if (filtros.data_fim) {
      query += " AND DATE(t.data_troca) <= ?"
      params.push(filtros.data_fim)
    }

    query += " ORDER BY t.data_troca DESC"

    const [rows] = await db.execute(query, params)
    return rows
  }

  static async buscarPorVendaId(vendaId) {
    const query = `
            SELECT t.*, 
                   pt.nome as peca_trocada_nome,
                   ps.nome as peca_substituta_nome,
                   u.email as usuario_email,
                   pu.nome as usuario_nome
            FROM troca t
            LEFT JOIN peca pt ON t.peca_trocada_id = pt.peca_id
            LEFT JOIN peca ps ON t.peca_substituta_id = ps.peca_id
            LEFT JOIN usuario u ON t.usuario_responsavel_id = u.usuario_id
            LEFT JOIN pessoa pu ON u.pessoa_id = pu.pessoa_id
            WHERE t.venda_id = ?
            ORDER BY t.data_troca DESC
        `
    const [rows] = await db.execute(query, [vendaId])
    return rows
  }

  static async atualizarStatus(id, status, motivo_rejeicao = null) {
    let query = "UPDATE troca SET status = ?"
    const params = [status]

    if (motivo_rejeicao) {
      query += ", motivo_rejeicao = ?"
      params.push(motivo_rejeicao)
    }

    query += " WHERE troca_id = ?"
    params.push(id)

    const [result] = await db.execute(query, params)
    return result.affectedRows > 0
  }
}

module.exports = TrocaModel
