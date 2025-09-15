const DashboardService = require("../services/dashboardService")

class DashboardController {
  // Dados completos do dashboard
  static async getDadosCompletos(req, res) {
    try {
      const dados = await DashboardService.getDadosCompletos()

      res.json({
        success: true,
        data: dados,
        message: "Dados do dashboard recuperados com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar dados do dashboard",
        details: error.message,
      })
    }
  }

  // Resumo geral
  static async getResumoGeral(req, res) {
    try {
      const resumo = await DashboardService.getResumoGeral()

      res.json({
        success: true,
        data: resumo,
        message: "Resumo geral recuperado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar resumo geral:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar resumo geral",
        details: error.message,
      })
    }
  }

  // Atividades recentes
  static async getAtividadesRecentes(req, res) {
    try {
      const limite = Number.parseInt(req.query.limite) || 10
      const atividades = await DashboardService.getAtividadesRecentes(limite)

      res.json({
        success: true,
        data: atividades,
        message: "Atividades recentes recuperadas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar atividades recentes:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar atividades recentes",
        details: error.message,
      })
    }
  }

  // Gráfico de vendas
  static async getGraficoVendas(req, res) {
    try {
      const dias = Number.parseInt(req.query.dias) || 7
      const grafico = await DashboardService.getGraficoVendas(dias)

      res.json({
        success: true,
        data: grafico,
        message: "Gráfico de vendas recuperado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar gráfico de vendas:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar gráfico de vendas",
        details: error.message,
      })
    }
  }

  // Estatísticas
  static async getStats(req, res) {
    try {
      const stats = await DashboardService.getResumoGeral()

      res.json({
        success: true,
        data: stats,
        message: "Estatísticas recuperadas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar estatísticas",
        details: error.message,
      })
    }
  }

  // Alertas
  static async getAlertas(req, res) {
    try {
      const alertas = await DashboardService.getAlertas()

      res.json({
        success: true,
        data: alertas,
        message: "Alertas recuperados com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar alertas:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar alertas",
        details: error.message,
      })
    }
  }

  // Vendas recentes
  static async getVendasRecentes(req, res) {
    try {
      const vendas = await DashboardService.getAtividadesRecentes(5)

      res.json({
        success: true,
        data: vendas,
        message: "Vendas recentes recuperadas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar vendas recentes:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar vendas recentes",
        details: error.message,
      })
    }
  }
}

module.exports = DashboardController
