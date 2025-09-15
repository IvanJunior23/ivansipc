const FaqService = require("../services/faqService")

class FaqController {
  // Listar todas as FAQs organizadas por categoria
  static async listarFaqs(req, res) {
    try {
      const resultado = await FaqService.getFaqsOrganizadas()

      res.json({
        success: true,
        data: resultado,
        message: "FAQs recuperadas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao listar FAQs:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao listar FAQs",
        details: error.message,
      })
    }
  }

  // Buscar FAQ por ID
  static async buscarFaqPorId(req, res) {
    try {
      const { id } = req.params
      const faq = await FaqService.getFaqById(id)

      res.json({
        success: true,
        data: faq,
        message: "FAQ encontrada com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar FAQ:", error)
      const status = error.message.includes("não encontrada") ? 404 : 500
      res.status(status).json({
        success: false,
        error: "Erro ao buscar FAQ",
        details: error.message,
      })
    }
  }

  // Criar nova FAQ
  static async criarFaq(req, res) {
    try {
      const faq = await FaqService.criarFaq(req.body)

      res.status(201).json({
        success: true,
        data: faq,
        message: "FAQ criada com sucesso",
      })
    } catch (error) {
      console.error("Erro ao criar FAQ:", error)
      res.status(400).json({
        success: false,
        error: "Erro ao criar FAQ",
        details: error.message,
      })
    }
  }

  // Atualizar FAQ
  static async atualizarFaq(req, res) {
    try {
      const { id } = req.params
      const faq = await FaqService.atualizarFaq(id, req.body)

      res.json({
        success: true,
        data: faq,
        message: "FAQ atualizada com sucesso",
      })
    } catch (error) {
      console.error("Erro ao atualizar FAQ:", error)
      const status = error.message.includes("não encontrada") ? 404 : 400
      res.status(status).json({
        success: false,
        error: "Erro ao atualizar FAQ",
        details: error.message,
      })
    }
  }

  // Deletar FAQ
  static async deletarFaq(req, res) {
    try {
      const { id } = req.params
      await FaqService.deletarFaq(id)

      res.json({
        success: true,
        message: "FAQ deletada com sucesso",
      })
    } catch (error) {
      console.error("Erro ao deletar FAQ:", error)
      const status = error.message.includes("não encontrada") ? 404 : 500
      res.status(status).json({
        success: false,
        error: "Erro ao deletar FAQ",
        details: error.message,
      })
    }
  }
}

module.exports = FaqController
