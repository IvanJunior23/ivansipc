const { db } = require("../../config/database")

class ItemVendaModel {
  static async criar(itemVenda) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO item_venda (venda_id, peca_id, quantidade, valor_unitario, desconto_item) 
                VALUES (?, ?, ?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        itemVenda.venda_id,
        itemVenda.peca_id,
        itemVenda.quantidade,
        itemVenda.valor_unitario,
        itemVenda.desconto_item || 0,
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

  static async buscarPorVendaId(vendaId) {
    const query = `
            SELECT iv.*, 
                   p.nome as peca_nome, p.descricao as peca_descricao,
                   m.nome as marca_nome,
                   c.nome as categoria_nome
            FROM item_venda iv
            LEFT JOIN peca p ON iv.peca_id = p.peca_id
            LEFT JOIN marca m ON p.marca_id = m.marca_id
            LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
            WHERE iv.venda_id = ?
            ORDER BY iv.item_venda_id
        `
    const [rows] = await db.execute(query, [vendaId])
    return rows
  }

  static async buscarPorId(id) {
    const query = `
            SELECT iv.*, 
                   p.nome as peca_nome, p.descricao as peca_descricao,
                   m.nome as marca_nome,
                   c.nome as categoria_nome
            FROM item_venda iv
            LEFT JOIN peca p ON iv.peca_id = p.peca_id
            LEFT JOIN marca m ON p.marca_id = m.marca_id
            LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
            WHERE iv.item_venda_id = ?
        `
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async atualizar(id, itemVenda) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                UPDATE item_venda 
                SET peca_id = ?, quantidade = ?, valor_unitario = ?, desconto_item = ?
                WHERE item_venda_id = ?
            `
      const [result] = await connection.execute(query, [
        itemVenda.peca_id,
        itemVenda.quantidade,
        itemVenda.valor_unitario,
        itemVenda.desconto_item,
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

  static async deletar(id) {
    const query = "DELETE FROM item_venda WHERE item_venda_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async deletarPorVendaId(vendaId) {
    const query = "DELETE FROM item_venda WHERE venda_id = ?"
    const [result] = await db.execute(query, [vendaId])
    return result.affectedRows > 0
  }
}

module.exports = ItemVendaModel
