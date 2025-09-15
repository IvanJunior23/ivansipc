// backend/routes/contatos.js
const express = require("express")
const router = express.Router()
const contatoController = require("../app/controllers/contatoController")
const { authenticateToken } = require("../middleware/auth")
const { validateContact } = require("../middleware/validation")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// Rotas CRUD
router.get("/", contatoController.list)
router.post("/", validateContact, contatoController.create)
router.put("/:id", validateContact, contatoController.update)

// Rota específica para alterar status - SEM validação completa
router.patch("/:id/status", contatoController.toggleStatus)

// REMOVIDO: router.delete("/:id", contatoController.remove) - não existe mais

module.exports = router
