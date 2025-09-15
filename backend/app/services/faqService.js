const FaqModel = require("../models/faqModel")

class FaqService {
  // Buscar todas as FAQs organizadas por categoria
  static async getFaqsOrganizadas() {
    try {
      const faqs = await FaqModel.getAll()
      const categorias = await FaqModel.getCategorias()

      const faqsOrganizadas = {}

      categorias.forEach((categoria) => {
        faqsOrganizadas[categoria] = faqs.filter((faq) => faq.categoria === categoria)
      })

      return {
        faqs: faqsOrganizadas,
        categorias,
        total: faqs.length,
      }
    } catch (error) {
      throw new Error(`Erro no serviço de FAQ: ${error.message}`)
    }
  }

  // Buscar FAQ por ID com validação
  static async getFaqById(id) {
    try {
      if (!id || isNaN(id)) {
        throw new Error("ID inválido")
      }

      const faq = await FaqModel.getById(id)
      if (!faq) {
        throw new Error("FAQ não encontrada")
      }

      return faq
    } catch (error) {
      throw new Error(`Erro ao buscar FAQ: ${error.message}`)
    }
  }

  // Criar FAQ com validação
  static async criarFaq(faqData) {
    try {
      const { pergunta, resposta, categoria } = faqData

      if (!pergunta || !pergunta.trim()) {
        throw new Error("Pergunta é obrigatória")
      }

      if (!resposta || !resposta.trim()) {
        throw new Error("Resposta é obrigatória")
      }

      if (!categoria || !categoria.trim()) {
        throw new Error("Categoria é obrigatória")
      }

      const faqId = await FaqModel.create({
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        categoria: categoria.trim(),
        ordem: faqData.ordem || 0,
      })

      return await FaqModel.getById(faqId)
    } catch (error) {
      throw new Error(`Erro ao criar FAQ: ${error.message}`)
    }
  }

  // Atualizar FAQ com validação
  static async atualizarFaq(id, faqData) {
    try {
      const faqExistente = await this.getFaqById(id)

      const { pergunta, resposta, categoria, ordem, status } = faqData

      if (pergunta !== undefined && (!pergunta || !pergunta.trim())) {
        throw new Error("Pergunta não pode estar vazia")
      }

      if (resposta !== undefined && (!resposta || !resposta.trim())) {
        throw new Error("Resposta não pode estar vazia")
      }

      if (categoria !== undefined && (!categoria || !categoria.trim())) {
        throw new Error("Categoria não pode estar vazia")
      }

      const dadosAtualizacao = {
        pergunta: pergunta !== undefined ? pergunta.trim() : faqExistente.pergunta,
        resposta: resposta !== undefined ? resposta.trim() : faqExistente.resposta,
        categoria: categoria !== undefined ? categoria.trim() : faqExistente.categoria,
        ordem: ordem !== undefined ? ordem : faqExistente.ordem,
        status: status !== undefined ? status : faqExistente.status,
      }

      const sucesso = await FaqModel.update(id, dadosAtualizacao)
      if (!sucesso) {
        throw new Error("Falha ao atualizar FAQ")
      }

      return await FaqModel.getById(id)
    } catch (error) {
      throw new Error(`Erro ao atualizar FAQ: ${error.message}`)
    }
  }

  // Deletar FAQ
  static async deletarFaq(id) {
    try {
      await this.getFaqById(id) // Verifica se existe

      const sucesso = await FaqModel.delete(id)
      if (!sucesso) {
        throw new Error("Falha ao deletar FAQ")
      }

      return true
    } catch (error) {
      throw new Error(`Erro ao deletar FAQ: ${error.message}`)
    }
  }
}

module.exports = FaqService
