const express = require("express")
const AlertaController = require("../app/controllers/alertaController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Buscar todos os alertas
router.get("/", authenticateToken, AlertaController.getTodosAlertas)

// Buscar alertas de estoque baixo
router.get("/estoque-baixo", authenticateToken, AlertaController.getAlertasEstoqueBaixo)

// Contar alertas
router.get("/contador", authenticateToken, AlertaController.getContadorAlertas)

module.exports = router
