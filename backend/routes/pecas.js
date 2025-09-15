const express = require("express")
const router = express.Router()
const PecaController = require("../app/controllers/pecaController")
const { validarPeca, validarImagemPeca } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

// Aplicar autenticação em todas as rotas
router.use(authenticateToken)

router.post("/", validarPeca, PecaController.criar)
router.get("/", PecaController.listar)
router.get("/:id", PecaController.buscarPorId)
router.put("/:id", validarPeca, PecaController.atualizar)
router.delete("/:id", PecaController.inativar)

router.post("/:id/imagens", validarImagemPeca, PecaController.adicionarImagem)
router.get("/:id/imagens", PecaController.buscarImagens)
router.delete("/:id/imagens/:imagemId", PecaController.removerImagem)

module.exports = router
