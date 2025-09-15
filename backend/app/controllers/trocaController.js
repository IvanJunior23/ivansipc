const TrocaService = require("../services/trocaService")

class TrocaController {
  static async criar(req, res) {
    try {
      const troca = await TrocaService.criarTroca(req.body)
      res.status(201).json({
        success: true,
        message: "Troca criada com sucesso",
        data: troca,
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
      const troca = await TrocaService.buscarTrocaPorId(req.params.id)
      res.json({
        success: true,
        data: troca,
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
      const filtros = {
        venda_id: req.query.venda_id,
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
      }

      const trocas = await TrocaService.listarTrocas(filtros)
      res.json({
        success: true,
        data: trocas,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async buscarPorVenda(req, res) {
    try {
      const trocas = await TrocaService.buscarTrocasPorVenda(req.params.vendaId)
      res.json({
        success: true,
        data: trocas,
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      })
    }
  }
}

module.exports = TrocaController
