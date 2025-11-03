const express = require("express")
const VendaController = require("../app/controllers/vendaController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Listar vendas
router.get("/", authenticateToken, VendaController.listar)

// Buscar venda por ID
router.get("/:id", authenticateToken, VendaController.buscarPorId)

// Criar venda
router.post("/", authenticateToken, VendaController.criar)

// Atualizar venda
router.put("/:id", authenticateToken, VendaController.atualizar)

// Finalizar venda com redução de estoque
router.post("/:id/finalizar", authenticateToken, VendaController.finalizar)

// Cancelar venda com reversão de estoque se necessário
router.post("/:id/cancelar", authenticateToken, VendaController.cancelar)

// Buscar itens de uma venda
router.get("/:id/itens", authenticateToken, VendaController.buscarItens)

module.exports = router
