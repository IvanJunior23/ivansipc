const express = require("express")
const TrocaController = require("../app/controllers/trocaController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Listar trocas
router.get("/", authenticateToken, TrocaController.listar)

// Buscar troca por ID
router.get("/:id", authenticateToken, TrocaController.buscarPorId)

// Buscar trocas por venda
router.get("/venda/:vendaId", authenticateToken, TrocaController.buscarPorVenda)

// Criar troca
router.post("/", authenticateToken, TrocaController.criar)

// Aprovar troca (atualiza estoque)
router.post("/:id/aprovar", authenticateToken, TrocaController.aprovar)

// Rejeitar troca
router.post("/:id/rejeitar", authenticateToken, TrocaController.rejeitar)

module.exports = router
