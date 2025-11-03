const RelatorioService = require("../services/relatorioService")

class RelatorioController {
  // Gerar relatório de estoque
  static async gerarRelatorioEstoque(req, res) {
    try {
      const filtros = {
        categoria_id: req.query.categoria_id,
        marca_id: req.query.marca_id,
        estoque_baixo: req.query.estoque_baixo === "true",
      }

      const relatorio = await RelatorioService.gerarRelatorioEstoque(filtros)

      res.json({
        success: true,
        data: relatorio,
        message: "Relatório de estoque gerado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar relatório de estoque:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao gerar relatório de estoque",
        details: error.message,
      })
    }
  }

  // Gerar relatório de vendas
  static async gerarRelatorioVendas(req, res) {
    try {
      const filtros = {
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
        cliente_id: req.query.cliente_id,
        status: req.query.status,
      }

      const relatorio = await RelatorioService.gerarRelatorioVendas(filtros)

      res.json({
        success: true,
        data: relatorio,
        message: "Relatório de vendas gerado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar relatório de vendas:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao gerar relatório de vendas",
        details: error.message,
      })
    }
  }

  // Gerar dados para dashboard
  static async gerarDadosDashboard(req, res) {
    try {
      const periodo = Number.parseInt(req.query.periodo) || 30

      const dashboard = await RelatorioService.gerarDadosDashboard(periodo)

      res.json({
        success: true,
        data: dashboard,
        message: "Dados do dashboard gerados com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar dados do dashboard:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao gerar dados do dashboard",
        details: error.message,
      })
    }
  }

  // Relatório de estoque baixo
  static async gerarRelatorioEstoqueBaixo(req, res) {
    try {
      const relatorio = await RelatorioService.gerarRelatorioEstoqueBaixo()

      res.json({
        success: true,
        data: relatorio,
        message: "Relatório de estoque baixo gerado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar relatório de estoque baixo:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao gerar relatório de estoque baixo",
        details: error.message,
      })
    }
  }

  static async gerarRelatorioClientes(req, res) {
    try {
      const filtros = {
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
        ativo: req.query.ativo,
      }

      const relatorio = await RelatorioService.gerarRelatorioClientes(filtros)

      res.json({
        success: true,
        data: relatorio,
        message: "Relatório de clientes gerado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar relatório de clientes:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao gerar relatório de clientes",
        details: error.message,
      })
    }
  }

  static async gerarRelatorioFinanceiro(req, res) {
    try {
      const filtros = {
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
        periodo: req.query.periodo || "mes",
      }

      const relatorio = await RelatorioService.gerarRelatorioFinanceiro(filtros)

      res.json({
        success: true,
        data: relatorio,
        message: "Relatório financeiro gerado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao gerar relatório financeiro",
        details: error.message,
      })
    }
  }
}

module.exports = RelatorioController
