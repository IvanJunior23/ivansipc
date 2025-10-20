const express = require("express")
const router = express.Router()
const imagemController = require("../app/controllers/imagemController")
const { authenticateToken } = require("../middleware/auth")

// Rota para servir imagens (sem autenticação para permitir visualização)
router.get("/serve/:filename", imagemController.serveImage)

// Aplicar autenticação em todas as outras rotas
router.use(authenticateToken)

// Rotas CRUD
router.get("/", imagemController.list)
router.get("/:id", imagemController.getById)
router.post("/upload", imagemController.uploadMultiple)
router.put("/:id", imagemController.update)

// Rota específica para alterar status
router.patch("/:id/status", imagemController.toggleStatus)

// Rota para deletar imagem
router.delete("/:id", imagemController.remove)

module.exports = router
