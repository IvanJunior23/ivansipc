const express = require("express")
const router = express.Router()
const pecaController = require("../app/controllers/pecaController")
const { validarPeca, validarImagemPeca } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")

router.use(authenticateToken)

router.get("/gerar-codigo", pecaController.gerarCodigo)

router.post("/", validarPeca, pecaController.create)
router.get("/", pecaController.list)
router.get("/:id", pecaController.getById)
router.put("/:id", validarPeca, pecaController.update)
router.delete("/:id", pecaController.remove)

router.patch("/:id/status", pecaController.toggleStatus)

router.post("/:id/imagens", pecaController.vincularImagem)
router.get("/:id/imagens", pecaController.buscarImagens)
router.delete("/:id/imagens/:imagemId", pecaController.removerImagem)

router.get("/fornecedor/:fornecedorId", pecaController.getByFornecedor)

module.exports = router
