const express = require("express")
const router = express.Router()
const HistoricoPrecoController = require("../app/controllers/historicoPrecoController")
const { authenticateToken } = require("../middleware/auth")

// Apply authentication to all routes
router.use(authenticateToken)

// Get price history for a part
router.get("/peca/:pecaId", HistoricoPrecoController.buscarPorPeca)

// Get price history for a part from a specific supplier
router.get("/peca/:pecaId/fornecedor/:fornecedorId", HistoricoPrecoController.buscarPorPecaEFornecedor)

// Get best prices for a part across all suppliers
router.get("/peca/:pecaId/melhor-preco", HistoricoPrecoController.buscarMelhorPreco)

// Get price statistics for a part
router.get("/peca/:pecaId/estatisticas", HistoricoPrecoController.buscarEstatisticas)

module.exports = router
