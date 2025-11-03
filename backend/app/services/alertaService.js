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

  static async getAlertasRecompra() {
    try {
      return await AlertaModel.getAlertasRecompra()
    } catch (error) {
      throw new Error(`Erro ao buscar alertas de recompra: ${error.message}`)
    }
  }

  static async getVendasPendentes() {
    try {
      return await AlertaModel.getVendasPendentes()
    } catch (error) {
      throw new Error(`Erro ao buscar vendas pendentes: ${error.message}`)
    }
  }

  static async getComprasPendentes() {
    try {
      return await AlertaModel.getComprasPendentes()
    } catch (error) {
      throw new Error(`Erro ao buscar compras pendentes: ${error.message}`)
    }
  }

  static async getStats() {
    try {
      const [alertasRecompra, estoqueBaixo, vendasPendentes, comprasPendentes] = await Promise.all([
        AlertaModel.getAlertasRecompra(),
        AlertaModel.getEstoqueBaixo(),
        AlertaModel.getVendasPendentes(),
        AlertaModel.getComprasPendentes(),
      ])

      return {
        estoque_baixo: estoqueBaixo.length,
        recompra: alertasRecompra.length,
        vendas_pendentes: vendasPendentes.length,
        compras_pendentes: comprasPendentes.length,
      }
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
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

  // Resolver alerta
  static async resolverAlerta(alertaId, usuarioId) {
    try {
      const alerta = await AlertaModel.buscarPorId(alertaId)
      if (!alerta) {
        throw new Error("Alerta não encontrado")
      }

      if (alerta.status === "Resolvido") {
        throw new Error("Alerta já foi resolvido")
      }

      const sucesso = await AlertaModel.resolver(alertaId, usuarioId)
      if (!sucesso) {
        throw new Error("Erro ao resolver alerta")
      }

      return {
        message: "Alerta resolvido com sucesso",
        data: await AlertaModel.buscarPorId(alertaId),
      }
    } catch (error) {
      throw new Error(`Erro ao resolver alerta: ${error.message}`)
    }
  }

  // Dispensar alerta
  static async dispensarAlerta(alertaId, usuarioId) {
    try {
      const alerta = await AlertaModel.buscarPorId(alertaId)
      if (!alerta) {
        throw new Error("Alerta não encontrado")
      }

      if (alerta.status === "Resolvido") {
        throw new Error("Alerta já foi resolvido")
      }

      const sucesso = await AlertaModel.dispensar(alertaId, usuarioId)
      if (!sucesso) {
        throw new Error("Erro ao dispensar alerta")
      }

      return {
        message: "Alerta dispensado com sucesso",
        data: await AlertaModel.buscarPorId(alertaId),
      }
    } catch (error) {
      throw new Error(`Erro ao dispensar alerta: ${error.message}`)
    }
  }
}

module.exports = AlertaService
