const express = require("express")
const { pool } = require("../config/database")
const { validarVenda } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Listar vendas
router.get("/", authenticateToken, async (req, res) => {
  const query = `
        SELECT v.*, c.nome_completo as cliente_nome, fp.nome as forma_pagamento_nome, u.email as vendedor_email
        FROM venda v
        LEFT JOIN cliente cl ON v.cliente_id = cl.cliente_id
        LEFT JOIN contato c ON cl.contato_id = c.contato_id
        LEFT JOIN forma_pagamento fp ON v.forma_pagamento_id = fp.forma_pagamento_id
        LEFT JOIN usuario u ON v.usuario_id = u.usuario_id
        ORDER BY v.data_hora DESC
    `

  try {
    const [results] = await pool.execute(query)
    res.json({
      success: true,
      data: results,
    })
  } catch (err) {
    console.error("Erro ao buscar vendas:", err)
    res.status(500).json({
      success: false,
      error: "Erro ao buscar vendas",
    })
  }
})

// Criar venda
router.post("/", authenticateToken, validarVenda, (req, res) => {
  const { cliente_id, itens, forma_pagamento_id, desconto_aplicado } = req.body
  const usuario_id = req.user.id

  // Calcular valor total
  let valor_total = 0
  itens.forEach((item) => {
    valor_total += item.valor_unitario * item.quantidade - (item.desconto_item || 0)
  })
  valor_total -= desconto_aplicado || 0

  pool.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Erro ao iniciar transação",
      })
    }

    // Inserir venda
    const vendaQuery = `
            INSERT INTO venda (cliente_id, valor_total, desconto_aplicado, forma_pagamento_id, usuario_id, status)
            VALUES (?, ?, ?, ?, ?, 'concluida')
        `

    pool.query(
      vendaQuery,
      [cliente_id, valor_total, desconto_aplicado, forma_pagamento_id, usuario_id],
      (err, vendaResult) => {
        if (err) {
          return pool.rollback(() => {
            res.status(500).json({
              success: false,
              error: "Erro ao criar venda",
            })
          })
        }

        const venda_id = vendaResult.insertId

        // Inserir itens da venda
        const itemPromises = itens.map((item) => {
          return new Promise((resolve, reject) => {
            const itemQuery = `
                        INSERT INTO item_venda (venda_id, peca_id, quantidade, valor_unitario, desconto_item, observacao)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `

            pool.query(
              itemQuery,
              [venda_id, item.peca_id, item.quantidade, item.valor_unitario, item.desconto_item, item.observacao],
              (err) => {
                if (err) reject(err)
                else resolve()
              },
            )
          })
        })

        Promise.all(itemPromises)
          .then(() => {
            pool.commit((err) => {
              if (err) {
                return pool.rollback(() => {
                  res.status(500).json({
                    success: false,
                    error: "Erro ao finalizar venda",
                  })
                })
              }
              res.json({
                success: true,
                data: { venda_id },
                message: "Venda criada com sucesso",
              })
            })
          })
          .catch(() => {
            pool.rollback(() => {
              res.status(500).json({
                success: false,
                error: "Erro ao inserir itens da venda",
              })
            })
          })
      },
    )
  })
})

// Buscar itens de uma venda
router.get("/:id/itens", authenticateToken, (req, res) => {
  const query = `
        SELECT iv.*, p.nome_descricao as produto_nome
        FROM item_venda iv
        JOIN peca p ON iv.peca_id = p.peca_id
        WHERE iv.venda_id = ?
    `

  pool.query(query, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Erro ao buscar itens da venda",
      })
    }
    res.json({
      success: true,
      data: results,
    })
  })
})

// Cancelar venda
router.put("/:id/cancelar", authenticateToken, (req, res) => {
  const query = 'UPDATE venda SET status = "cancelada" WHERE venda_id = ?'

  pool.query(query, [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Erro ao cancelar venda",
      })
    }
    res.json({
      success: true,
      message: "Venda cancelada com sucesso",
    })
  })
})

// Listar formas de pagamento
router.get("/formas-pagamento", authenticateToken, (req, res) => {
  const query = "SELECT * FROM forma_pagamento WHERE status = TRUE ORDER BY nome"

  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Erro ao buscar formas de pagamento",
      })
    }
    res.json({
      success: true,
      data: results,
    })
  })
})

module.exports = router
