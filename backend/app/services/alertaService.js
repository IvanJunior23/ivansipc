const AlertaModel = require("../models/alertaModel")

class AlertaService {
  // Buscar todos os alertas
  static async getTodosAlertas() {
    try {
      const [estoqueBaixo, vendasPendentes, comprasPendentes] = await Promise.all([
        AlertaModel.getEstoqueBaixo(),
        AlertaModel.getVendasPendentes(),
        AlertaModel.getComprasPendentes(),
      ])

      return {
        estoque_baixo: estoqueBaixo,
        vendas_pendentes: vendasPendentes,
        compras_pendentes: comprasPendentes,
        resumo: {
          total_estoque_baixo: estoqueBaixo.length,
          total_vendas_pendentes: vendasPendentes.length,
          total_compras_pendentes: comprasPendentes.length,
          total_geral: estoqueBaixo.length + vendasPendentes.length + comprasPendentes.length,
        },
      }
    } catch (error) {
      throw new Error(`Erro no serviço de alertas: ${error.message}`)
    }
  }

  // Buscar apenas alertas de estoque baixo
  static async getAlertasEstoqueBaixo() {
    try {
      return await AlertaModel.getEstoqueBaixo()
    } catch (error) {
      throw new Error(`Erro ao buscar alertas de estoque baixo: ${error.message}`)
    }
  }

  // Contar alertas
  static async getContadorAlertas() {
    try {
      return await AlertaModel.getTotalAlertas()
    } catch (error) {
      throw new Error(`Erro ao contar alertas: ${error.message}`)
    }
  }
}

module.exports = AlertaService
