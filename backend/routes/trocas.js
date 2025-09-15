const express = require("express")
const { pool } = require("../config/database")
const { validarTroca } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Listar trocas
router.get("/", authenticateToken, async (req, res) => {
  const query = `
    SELECT t.*, 
           v.venda_id,
           c.nome_completo as cliente_nome,
           po.nome as peca_original_nome,
           pn.nome as peca_nova_nome,
           u.email as usuario_email
    FROM troca t
    LEFT JOIN venda v ON t.venda_id = v.venda_id
    LEFT JOIN cliente cl ON v.cliente_id = cl.cliente_id
    LEFT JOIN contato c ON cl.contato_id = c.contato_id
    LEFT JOIN peca po ON t.peca_original_id = po.peca_id
    LEFT JOIN peca pn ON t.peca_nova_id = pn.peca_id
    LEFT JOIN usuario u ON t.usuario_id = u.usuario_id
    ORDER BY t.data_troca DESC
  `

  try {
    const [results] = await pool.execute(query)
    res.json({
      success: true,
      data: results,
    })
  } catch (err) {
    console.error("Erro ao buscar trocas:", err)
    res.status(500).json({
      success: false,
      error: "Erro ao buscar trocas",
    })
  }
})

// Buscar troca por ID
router.get("/:id", authenticateToken, async (req, res) => {
  const query = `
    SELECT t.*, 
           v.venda_id,
           c.nome_completo as cliente_nome,
           po.nome as peca_original_nome,
           pn.nome as peca_nova_nome,
           u.email as usuario_email
    FROM troca t
    LEFT JOIN venda v ON t.venda_id = v.venda_id
    LEFT JOIN cliente cl ON v.cliente_id = cl.cliente_id
    LEFT JOIN contato c ON cl.contato_id = c.contato_id
    LEFT JOIN peca po ON t.peca_original_id = po.peca_id
    LEFT JOIN peca pn ON t.peca_nova_id = pn.peca_id
    LEFT JOIN usuario u ON t.usuario_id = u.usuario_id
    WHERE t.troca_id = ?
  `

  try {
    const [results] = await pool.execute(query, [req.params.id])
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Troca não encontrada",
      })
    }
    res.json({
      success: true,
      data: results[0],
    })
  } catch (err) {
    console.error("Erro ao buscar troca:", err)
    res.status(500).json({
      success: false,
      error: "Erro ao buscar troca",
    })
  }
})

// Criar troca
router.post("/", authenticateToken, validarTroca, async (req, res) => {
  const { venda_id, peca_original_id, peca_nova_id, quantidade, motivo, data_troca } = req.body
  const usuario_id = req.user.id

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Verificar se a venda existe e está concluída
    const [vendaResults] = await connection.execute("SELECT status FROM venda WHERE venda_id = ?", [venda_id])

    if (vendaResults.length === 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Venda não encontrada",
      })
    }

    if (vendaResults[0].status !== "concluida") {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Só é possível trocar itens de vendas concluídas",
      })
    }

    // Verificar se a peça original foi vendida nesta venda
    const [itemVendaResults] = await connection.execute(
      "SELECT quantidade FROM item_venda WHERE venda_id = ? AND peca_id = ?",
      [venda_id, peca_original_id],
    )

    if (itemVendaResults.length === 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Peça original não foi vendida nesta venda",
      })
    }

    if (itemVendaResults[0].quantidade < quantidade) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Quantidade de troca maior que a quantidade vendida",
      })
    }

    // Verificar se a peça nova existe e tem estoque suficiente
    const [pecaNovaResults] = await connection.execute("SELECT quantidade_estoque FROM peca WHERE peca_id = ?", [
      peca_nova_id,
    ])

    if (pecaNovaResults.length === 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Peça nova não encontrada",
      })
    }

    if (pecaNovaResults[0].quantidade_estoque < quantidade) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Estoque insuficiente da peça nova",
      })
    }

    // Inserir troca
    const [trocaResult] = await connection.execute(
      `INSERT INTO troca (venda_id, peca_original_id, peca_nova_id, quantidade, motivo, data_troca, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        venda_id,
        peca_original_id,
        peca_nova_id,
        quantidade,
        motivo,
        data_troca || new Date().toISOString().split("T")[0],
        usuario_id,
      ],
    )

    // Atualizar estoque: devolver peça original e retirar peça nova
    await connection.execute("UPDATE peca SET quantidade_estoque = quantidade_estoque + ? WHERE peca_id = ?", [
      quantidade,
      peca_original_id,
    ])

    await connection.execute("UPDATE peca SET quantidade_estoque = quantidade_estoque - ? WHERE peca_id = ?", [
      quantidade,
      peca_nova_id,
    ])

    await connection.commit()

    res.json({
      success: true,
      data: { troca_id: trocaResult.insertId },
      message: "Troca realizada com sucesso",
    })
  } catch (err) {
    await connection.rollback()
    console.error("Erro ao criar troca:", err)
    res.status(500).json({
      success: false,
      error: "Erro ao criar troca",
    })
  } finally {
    connection.release()
  }
})

// Cancelar troca
router.put("/:id/cancelar", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Buscar dados da troca
    const [trocaResults] = await connection.execute("SELECT * FROM troca WHERE troca_id = ? AND status = 'ativa'", [
      req.params.id,
    ])

    if (trocaResults.length === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        error: "Troca não encontrada ou já cancelada",
      })
    }

    const troca = trocaResults[0]

    // Reverter movimentação de estoque
    await connection.execute("UPDATE peca SET quantidade_estoque = quantidade_estoque - ? WHERE peca_id = ?", [
      troca.quantidade,
      troca.peca_original_id,
    ])

    await connection.execute("UPDATE peca SET quantidade_estoque = quantidade_estoque + ? WHERE peca_id = ?", [
      troca.quantidade,
      troca.peca_nova_id,
    ])

    // Cancelar troca
    await connection.execute("UPDATE troca SET status = 'cancelada' WHERE troca_id = ?", [req.params.id])

    await connection.commit()

    res.json({
      success: true,
      message: "Troca cancelada com sucesso",
    })
  } catch (err) {
    await connection.rollback()
    console.error("Erro ao cancelar troca:", err)
    res.status(500).json({
      success: false,
      error: "Erro ao cancelar troca",
    })
  } finally {
    connection.release()
  }
})

module.exports = router
