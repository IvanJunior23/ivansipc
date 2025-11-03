const express = require("express")
const AlertaController = require("../app/controllers/alertaController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Buscar todos os alertas
router.get("/", authenticateToken, AlertaController.getTodosAlertas)

// Buscar alertas de estoque baixo
router.get("/estoque-baixo", authenticateToken, AlertaController.getAlertasEstoqueBaixo)

router.get("/recompra", authenticateToken, AlertaController.getAlertasRecompra)

router.get("/vendas-pendentes", authenticateToken, AlertaController.getVendasPendentes)

router.get("/compras-pendentes", authenticateToken, AlertaController.getComprasPendentes)

router.get("/stats", authenticateToken, AlertaController.getStats)

// Contar alertas
router.get("/contador", authenticateToken, AlertaController.getContadorAlertas)

router.put("/:id/resolver", authenticateToken, AlertaController.resolverAlerta)
router.put("/:id/dispensar", authenticateToken, AlertaController.dispensarAlerta)

module.exports = router
