const express = require("express")
const router = express.Router()
const CompraController = require("../app/controllers/compraController")
const { validarCompra } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarCompra, CompraController.criar)
router.get("/", CompraController.listar)
router.get("/:id", CompraController.buscarPorId)
router.put("/:id", validarCompra, CompraController.atualizar)
router.patch("/:id/receber", CompraController.receber)
router.patch("/:id/cancelar", CompraController.cancelar)
router.get("/:id/itens", CompraController.buscarItens)

module.exports = router
