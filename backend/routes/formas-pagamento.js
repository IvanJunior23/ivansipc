const express = require("express")
const router = express.Router()
const FormaPagamentoController = require("../app/controllers/formaPagamentoController")
const { validarFormaPagamento } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarFormaPagamento, FormaPagamentoController.criar)
router.get("/", FormaPagamentoController.listar)
router.get("/:id", FormaPagamentoController.buscarPorId)
router.put("/:id", validarFormaPagamento, FormaPagamentoController.atualizar)
router.delete("/:id", FormaPagamentoController.inativar)

module.exports = router
