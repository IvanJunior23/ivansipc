const { db } = require("../../config/database")

class ItemCompraModel {
  static async criar(itemCompra) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO item_compra (compra_id, peca_id, quantidade, valor_unitario) 
                VALUES (?, ?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        itemCompra.compra_id,
        itemCompra.peca_id,
        itemCompra.quantidade,
        itemCompra.valor_unitario,
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

  static async buscarPorCompraId(compraId) {
    const query = `
            SELECT ic.*, 
                   p.nome as peca_nome, p.descricao as peca_descricao,
                   m.nome as marca_nome,
                   c.nome as categoria_nome
            FROM item_compra ic
            LEFT JOIN peca p ON ic.peca_id = p.peca_id
            LEFT JOIN marca m ON p.marca_id = m.marca_id
            LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
            WHERE ic.compra_id = ?
            ORDER BY ic.item_compra_id
        `
    const [rows] = await db.execute(query, [compraId])
    return rows
  }

  static async buscarPorId(id) {
    const query = `
            SELECT ic.*, 
                   p.nome as peca_nome, p.descricao as peca_descricao,
                   m.nome as marca_nome,
                   c.nome as categoria_nome
            FROM item_compra ic
            LEFT JOIN peca p ON ic.peca_id = p.peca_id
            LEFT JOIN marca m ON p.marca_id = m.marca_id
            LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
            WHERE ic.item_compra_id = ?
        `
    const [rows] = await db.execute(query, [id])
    return rows[0]
  }

  static async atualizar(id, itemCompra) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                UPDATE item_compra 
                SET peca_id = ?, quantidade = ?, valor_unitario = ?
                WHERE item_compra_id = ?
            `
      const [result] = await connection.execute(query, [
        itemCompra.peca_id,
        itemCompra.quantidade,
        itemCompra.valor_unitario,
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
    const query = "DELETE FROM item_compra WHERE item_compra_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async deletarPorCompraId(compraId) {
    const query = "DELETE FROM item_compra WHERE compra_id = ?"
    const [result] = await db.execute(query, [compraId])
    return result.affectedRows > 0
  }
}

module.exports = ItemCompraModel
