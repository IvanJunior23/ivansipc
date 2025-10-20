const FormaPagamentoService = require("../services/formaPagamentoService")

class FormaPagamentoController {
  static async criar(req, res) {
    try {
      const formaPagamento = await FormaPagamentoService.criarFormaPagamento(req.body)
      res.status(201).json({
        success: true,
        message: "Forma de pagamento criada com sucesso",
        data: formaPagamento,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async buscarPorId(req, res) {
    try {
      const formaPagamento = await FormaPagamentoService.buscarFormaPagamentoPorId(req.params.id)
      res.json({
        success: true,
        data: formaPagamento,
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async listar(req, res) {
    try {
      const incluirInativos = req.query.incluir_inativos === "true"
      const formasPagamento = await FormaPagamentoService.listarFormasPagamento(incluirInativos)
      res.json({
        success: true,
        data: formasPagamento,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async atualizar(req, res) {
    try {
      const formaPagamento = await FormaPagamentoService.atualizarFormaPagamento(req.params.id, req.body)
      res.json({
        success: true,
        message: "Forma de pagamento atualizada com sucesso",
        data: formaPagamento,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async inativar(req, res) {
    try {
      const resultado = await FormaPagamentoService.inativarFormaPagamento(req.params.id)
      res.json({
        success: true,
        message: resultado.message,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async toggleStatus(req, res) {
    try {
      const { id } = req.params
      const { status } = req.body

      console.log("🔄 Controller: alterando status da forma de pagamento ID:", id, "para:", status)

      // Validar se o parâmetro status foi fornecido
      if (status === undefined || status === null) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "status" é obrigatório',
        })
      }

      // Validar se é um valor boolean válido
      if (typeof status !== "boolean" && status !== 0 && status !== 1 && status !== "0" && status !== "1") {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "status" deve ser boolean, 0 ou 1',
        })
      }

      const formaPagamentoAtualizada = await FormaPagamentoService.updateFormaPagamentoStatus(id, status)
      res.json({ success: true, data: formaPagamentoAtualizada })
    } catch (error) {
      console.error("❌ Controller: erro ao alterar status:", error)
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno do servidor",
      })
    }
  }
}

module.exports = FormaPagamentoController
