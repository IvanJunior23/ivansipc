// backend/routes/enderecos.js
const express = require("express")
const router = express.Router()
const enderecoController = require("../app/controllers/enderecoController")
const { authenticateToken } = require("../middleware/auth")
const { validateAddress } = require("../middleware/validation")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// Rotas CRUD
router.get("/", enderecoController.list)
router.post("/", validateAddress, enderecoController.create)
router.put("/:id", validateAddress, enderecoController.update)

// Rota específica para alterar status - SEM validação completa
router.patch("/:id/status", enderecoController.toggleStatus)

// Manter rota DELETE para compatibilidade (soft delete)
router.delete("/:id", enderecoController.remove)

module.exports = router
