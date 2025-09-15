const express = require("express")
const router = express.Router()
const MarcaController = require("../app/controllers/marcaController")
const { validarMarca } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarMarca, MarcaController.criar)
router.get("/", MarcaController.listar)
router.get("/:id", MarcaController.buscarPorId)
router.put("/:id", validarMarca, MarcaController.atualizar)
router.delete("/:id", MarcaController.inativar)

module.exports = router
