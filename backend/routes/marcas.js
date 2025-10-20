const express = require("express")
const router = express.Router()
const marcaController = require("../app/controllers/marcaController")
const { validarMarca } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarMarca, marcaController.create)
router.get("/", marcaController.list)
router.put("/:id", validarMarca, marcaController.update)
router.delete("/:id", marcaController.remove)

router.patch("/:id/status", marcaController.toggleStatus)

module.exports = router
