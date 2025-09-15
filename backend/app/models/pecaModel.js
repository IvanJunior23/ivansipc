const db = require("../../config/database")

class PecaModel {
  static async criar(peca) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                INSERT INTO peca (nome, descricao, marca_id, preco_venda, preco_custo, 
                                quantidade_estoque, quantidade_minima, categoria_id, condicao, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
      const [result] = await connection.execute(query, [
        peca.nome,
        peca.descricao || null,
        peca.marca_id || null,
        peca.preco_venda,
        peca.preco_custo,
        peca.quantidade_estoque || 0,
        peca.quantidade_minima,
        peca.categoria_id || null,
        peca.condicao || "novo",
        peca.status !== undefined ? peca.status : true,
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
                   c.nome as categoria_nome,
                   m.nome as marca_nome,
                   GROUP_CONCAT(i.referencia_url) as imagens
            FROM peca p
            LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
            LEFT JOIN marca m ON p.marca_id = m.marca_id
            LEFT JOIN peca_imagem pi ON p.peca_id = pi.peca_id
            LEFT JOIN imagem i ON pi.imagem_id = i.imagem_id AND i.status = true
            WHERE p.peca_id = ?
            GROUP BY p.peca_id
        `
    const [rows] = await db.execute(query, [id])
    if (rows[0] && rows[0].imagens) {
      rows[0].imagens = rows[0].imagens.split(",")
    }
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false, filtros = {}) {
    let query = `
            SELECT p.*, 
                   c.nome as categoria_nome,
                   m.nome as marca_nome,
                   COUNT(pi.imagem_id) as total_imagens
            FROM peca p
            LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
            LEFT JOIN marca m ON p.marca_id = m.marca_id
            LEFT JOIN peca_imagem pi ON p.peca_id = pi.peca_id
            LEFT JOIN imagem i ON pi.imagem_id = i.imagem_id AND i.status = true
            WHERE 1=1
        `
    const params = []

    if (!incluirInativos) {
      query += " AND p.status = true"
    }

    if (filtros.categoria_id) {
      query += " AND p.categoria_id = ?"
      params.push(filtros.categoria_id)
    }

    if (filtros.marca_id) {
      query += " AND p.marca_id = ?"
      params.push(filtros.marca_id)
    }

    if (filtros.condicao) {
      query += " AND p.condicao = ?"
      params.push(filtros.condicao)
    }

    if (filtros.estoque_baixo) {
      query += " AND p.quantidade_estoque <= p.quantidade_minima"
    }

    query += " GROUP BY p.peca_id ORDER BY p.nome"

    const [rows] = await db.execute(query, params)
    return rows
  }

  static async atualizar(id, peca) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const query = `
                UPDATE peca 
                SET nome = ?, descricao = ?, marca_id = ?, preco_venda = ?, preco_custo = ?,
                    quantidade_estoque = ?, quantidade_minima = ?, categoria_id = ?, 
                    condicao = ?, status = ?
                WHERE peca_id = ?
            `
      const [result] = await connection.execute(query, [
        peca.nome,
        peca.descricao,
        peca.marca_id,
        peca.preco_venda,
        peca.preco_custo,
        peca.quantidade_estoque,
        peca.quantidade_minima,
        peca.categoria_id,
        peca.condicao,
        peca.status,
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
    const query = "UPDATE peca SET status = false WHERE peca_id = ?"
    const [result] = await db.execute(query, [id])
    return result.affectedRows > 0
  }

  static async adicionarImagem(pecaId, imagemId) {
    const query = "INSERT INTO peca_imagem (peca_id, imagem_id) VALUES (?, ?)"
    const [result] = await db.execute(query, [pecaId, imagemId])
    return result.affectedRows > 0
  }

  static async removerImagem(pecaId, imagemId) {
    const query = "DELETE FROM peca_imagem WHERE peca_id = ? AND imagem_id = ?"
    const [result] = await db.execute(query, [pecaId, imagemId])
    return result.affectedRows > 0
  }

  static async buscarImagensPeca(pecaId) {
    const query = `
            SELECT i.* FROM imagem i
            INNER JOIN peca_imagem pi ON i.imagem_id = pi.imagem_id
            WHERE pi.peca_id = ? AND i.status = true
            ORDER BY i.imagem_id
        `
    const [rows] = await db.execute(query, [pecaId])
    return rows
  }
}

module.exports = PecaModel
