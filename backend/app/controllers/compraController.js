const CompraService = require("../services/compraService")

class CompraController {
  static async criar(req, res) {
    try {
      const { itens, ...dadosCompra } = req.body
      const compra = await CompraService.criarCompra(dadosCompra, itens)
      res.status(201).json({
        success: true,
        message: "Compra criada com sucesso",
        data: compra,
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
      const compra = await CompraService.buscarCompraPorId(req.params.id)
      res.json({
        success: true,
        data: compra,
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
        fornecedor_id: req.query.fornecedor_id,
        status: req.query.status,
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
      }

      const compras = await CompraService.listarCompras(filtros)
      res.json({
        success: true,
        data: compras,
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
      const { itens, ...dadosCompra } = req.body
      const compra = await CompraService.atualizarCompra(req.params.id, dadosCompra, itens)
      res.json({
        success: true,
        message: "Compra atualizada com sucesso",
        data: compra,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async receber(req, res) {
    try {
      const resultado = await CompraService.receberCompra(req.params.id)
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

  static async cancelar(req, res) {
    try {
      const resultado = await CompraService.cancelarCompra(req.params.id)
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

  static async buscarItens(req, res) {
    try {
      const itens = await CompraService.buscarItensCompra(req.params.id)
      res.json({
        success: true,
        data: itens,
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      })
    }
  }
}

module.exports = CompraController
