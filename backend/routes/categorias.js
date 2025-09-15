const express = require("express")
const router = express.Router()
const CategoriaController = require("../app/controllers/categoriaController")
const { validarCategoria } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarCategoria, CategoriaController.criar)
router.get("/", CategoriaController.listar)
router.get("/:id", CategoriaController.buscarPorId)
router.put("/:id", validarCategoria, CategoriaController.atualizar)
router.delete("/:id", CategoriaController.inativar)

module.exports = router
