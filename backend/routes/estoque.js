const express = require("express")
const router = express.Router()
const { pool } = require("../config/database")

// GET - Consultar estoque
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.id, p.nome, p.quantidade_estoque, p.quantidade_minima, c.nome as categoria,
             CASE 
               WHEN p.quantidade_estoque <= 0 THEN 'critico'
               WHEN p.quantidade_estoque <= p.quantidade_minima THEN 'baixo'
               ELSE 'normal'
             END as status_estoque
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.status = 'ativo'
      ORDER BY p.quantidade_estoque ASC
    `)
    res.json(rows)
  } catch (error) {
    console.error("Erro ao consultar estoque:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// POST - Registrar movimentação de estoque
router.post("/movimentacao", async (req, res) => {
  try {
    const { produto_id, tipo, quantidade, observacao } = req.body

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Registrar movimentação
      await connection.execute(
        "INSERT INTO movimentacao_estoque (produto_id, tipo, quantidade, observacao) VALUES (?, ?, ?, ?)",
        [produto_id, tipo, quantidade, observacao],
      )

      // Atualizar estoque do produto
      if (tipo === "entrada") {
        await connection.execute("UPDATE produtos SET quantidade_estoque = quantidade_estoque + ? WHERE id = ?", [
          quantidade,
          produto_id,
        ])
      } else if (tipo === "saida") {
        await connection.execute("UPDATE produtos SET quantidade_estoque = quantidade_estoque - ? WHERE id = ?", [
          quantidade,
          produto_id,
        ])
      }

      await connection.commit()
      res.json({ message: "Movimentação registrada com sucesso" })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET - Histórico de movimentações
router.get("/movimentacoes", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT m.*, p.nome as produto_nome
      FROM movimentacao_estoque m
      LEFT JOIN produtos p ON m.produto_id = p.id
      ORDER BY m.data_movimentacao DESC
      LIMIT 100
    `)
    res.json(rows)
  } catch (error) {
    console.error("Erro ao buscar movimentações:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

module.exports = router
