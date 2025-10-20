const express = require("express")
const router = express.Router()
const FornecedorController = require("../app/controllers/fornecedorController")
const { validarFornecedor } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarFornecedor, FornecedorController.criar)
router.get("/", FornecedorController.listar)
router.get("/:id", FornecedorController.buscarPorId)
router.put("/:id", validarFornecedor, FornecedorController.atualizar)
router.delete("/:id", FornecedorController.inativar)

router.patch("/:id/status", FornecedorController.toggleStatus)

module.exports = router
