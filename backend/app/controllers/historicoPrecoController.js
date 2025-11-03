const HistoricoPrecoModel = require("../models/historicoPrecoModel")

class HistoricoPrecoController {
  static async buscarPorPeca(req, res) {
    try {
      const { pecaId } = req.params
      const historico = await HistoricoPrecoModel.buscarPorPeca(pecaId)

      res.json({
        success: true,
        data: historico,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async buscarPorPecaEFornecedor(req, res) {
    try {
      const { pecaId, fornecedorId } = req.params
      const historico = await HistoricoPrecoModel.buscarPorPecaEFornecedor(pecaId, fornecedorId)

      res.json({
        success: true,
        data: historico,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async buscarMelhorPreco(req, res) {
    try {
      const { pecaId } = req.params
      const melhoresPrecos = await HistoricoPrecoModel.buscarMelhorPreco(pecaId)

      res.json({
        success: true,
        data: melhoresPrecos,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async buscarEstatisticas(req, res) {
    try {
      const { pecaId } = req.params
      const estatisticas = await HistoricoPrecoModel.buscarEstatisticas(pecaId)

      res.json({
        success: true,
        data: estatisticas,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
}

module.exports = HistoricoPrecoController
