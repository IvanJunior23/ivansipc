const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const dashboardController = require("../app/controllers/dashboardController")

router.get("/stats", authenticateToken, dashboardController.getStats)

router.get("/alertas", authenticateToken, dashboardController.getAlertas)

router.get("/vendas-recentes", authenticateToken, dashboardController.getVendasRecentes)

router.get("/grafico-vendas", authenticateToken, dashboardController.getGraficoVendas)

module.exports = router
