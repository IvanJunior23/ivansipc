const express = require("express")
const router = express.Router()
const ClienteController = require("../app/controllers/clienteController")
const { validarCliente } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarCliente, ClienteController.criar)
router.get("/", ClienteController.listar)
router.get("/:id", ClienteController.buscarPorId)
router.put("/:id", validarCliente, ClienteController.atualizar)
router.delete("/:id", ClienteController.inativar)
router.patch("/:id/status", ClienteController.toggleStatus)

module.exports = router
