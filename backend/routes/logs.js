const express = require("express")
const router = express.Router()
const logController = require("../app/controllers/logController")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken)

// Rotas para logs
router.get("/", logController.getAllLogs)
router.get("/login", logController.getLoginLogs)
router.get("/login/stats", logController.getLoginStats)
router.get("/:id", logController.getLogById)

module.exports = router
