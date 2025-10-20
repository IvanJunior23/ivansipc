const express = require("express")
const router = express.Router()
const categoriaController = require("../app/controllers/categoriaController")
const { authenticateToken } = require("../middleware/auth")
const { validarCategoria } = require("../middleware/validation")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

// Rotas CRUD
router.get("/", categoriaController.list)
router.post("/", validarCategoria, categoriaController.create)
router.put("/:id", validarCategoria, categoriaController.update)

// Rota específica para alterar status - SEM validação completa
router.patch("/:id/status", categoriaController.toggleStatus)

// Manter rota DELETE para compatibilidade (soft delete)
router.delete("/:id", categoriaController.remove)

module.exports = router
