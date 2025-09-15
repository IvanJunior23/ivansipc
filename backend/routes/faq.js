const express = require("express")
const FaqController = require("../app/controllers/faqController")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Rotas públicas (não precisam de autenticação)
router.get("/", FaqController.listarFaqs)
router.get("/:id", FaqController.buscarFaqPorId)

// Rotas administrativas (precisam de autenticação)
router.post("/", authenticateToken, FaqController.criarFaq)
router.put("/:id", authenticateToken, FaqController.atualizarFaq)
router.delete("/:id", authenticateToken, FaqController.deletarFaq)

module.exports = router
