const AlertaService = require("../services/alertaService")

class AlertaController {
  // Buscar todos os alertas
  static async getTodosAlertas(req, res) {
    try {
      const alertas = await AlertaService.getTodosAlertas()

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

  // Buscar alertas de estoque baixo
  static async getAlertasEstoqueBaixo(req, res) {
    try {
      const alertas = await AlertaService.getAlertasEstoqueBaixo()

      res.json({
        success: true,
        data: alertas,
        message: "Alertas de estoque baixo recuperados com sucesso",
      })
    } catch (error) {
      console.error("Erro ao buscar alertas de estoque baixo:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao buscar alertas de estoque baixo",
        details: error.message,
      })
    }
  }

  // Contar alertas
  static async getContadorAlertas(req, res) {
    try {
      const contador = await AlertaService.getContadorAlertas()

      res.json({
        success: true,
        data: contador,
        message: "Contador de alertas recuperado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao contar alertas:", error)
      res.status(500).json({
        success: false,
        error: "Erro ao contar alertas",
        details: error.message,
      })
    }
  }
}

module.exports = AlertaController
