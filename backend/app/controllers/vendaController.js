const VendaService = require("../services/vendaService")

class VendaController {
  static async criar(req, res) {
    try {
      const { itens, ...dadosVenda } = req.body
      const venda = await VendaService.criarVenda(dadosVenda, itens)
      res.status(201).json({
        success: true,
        message: "Venda criada com sucesso",
        data: venda,
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
      const venda = await VendaService.buscarVendaPorId(req.params.id)
      res.json({
        success: true,
        data: venda,
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
      console.log(" VendaController.listar - Filtros recebidos:", req.query)

      const filtros = {
        cliente_id: req.query.cliente_id,
        status: req.query.status,
        forma_pagamento_id: req.query.forma_pagamento_id,
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
      }

      const vendas = await VendaService.listarVendas(filtros)

      console.log(" VendaController.listar - Vendas encontradas:", vendas.length)

      res.json({
        success: true,
        data: vendas,
      })
    } catch (error) {
      console.error(" Erro ao listar vendas:", error)
      console.error(" Stack trace:", error.stack)

      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async atualizar(req, res) {
    try {
      const { itens, ...dadosVenda } = req.body
      const venda = await VendaService.atualizarVenda(req.params.id, dadosVenda, itens)
      res.json({
        success: true,
        message: "Venda atualizada com sucesso",
        data: venda,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async concluir(req, res) {
    try {
      const resultado = await VendaService.concluirVenda(req.params.id)
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

  static async finalizar(req, res) {
    try {
      const resultado = await VendaService.finalizarVenda(req.params.id)
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
      const resultado = await VendaService.cancelarVenda(req.params.id)
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
      const itens = await VendaService.buscarItensVenda(req.params.id)
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

module.exports = VendaController
