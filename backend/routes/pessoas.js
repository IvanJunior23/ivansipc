// backend/routes/pessoas.js
const express = require("express")
const router = express.Router()
const pessoaController = require("../app/controllers/PessoaController")
const { authenticateToken } = require("../middleware/auth")
const { validatePessoa } = require("../middleware/validation")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// Rotas CRUD
router.get("/", pessoaController.list)
router.post("/", validatePessoa, pessoaController.create)
router.put("/:id", validatePessoa, pessoaController.update)

// Rota específica para alterar status - SEM validação completa
router.patch("/:id/status", pessoaController.toggleStatus)

module.exports = router
