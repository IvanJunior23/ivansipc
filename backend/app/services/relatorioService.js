const RelatorioModel = require("../models/relatorioModel")

class RelatorioService {
  // Gerar relatório de estoque
  static async gerarRelatorioEstoque(filtros = {}) {
    try {
      const dados = await RelatorioModel.getRelatorioEstoque(filtros)

      // Calcular totais
      const resumo = {
        total_itens: dados.length,
        valor_total_estoque: dados.reduce((sum, item) => sum + (item.valor_estoque || 0), 0),
        itens_estoque_baixo: dados.filter((item) => item.quantidade_estoque <= item.quantidade_minima).length,
      }

      return {
        dados,
        resumo,
        filtros_aplicados: filtros,
      }
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de estoque: ${error.message}`)
    }
  }

  // Gerar relatório de vendas
  static async gerarRelatorioVendas(filtros = {}) {
    try {
      const dados = await RelatorioModel.getRelatorioVendas(filtros)

      // Calcular totais
      const resumo = {
        total_vendas: dados.length,
        valor_total_vendas: dados.reduce((sum, venda) => sum + (venda.valor_total || 0), 0),
        vendas_concluidas: dados.filter((venda) => venda.status === "concluida").length,
        vendas_canceladas: dados.filter((venda) => venda.status === "cancelada").length,
      }

      return {
        dados,
        resumo,
        filtros_aplicados: filtros,
      }
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de vendas: ${error.message}`)
    }
  }

  // Gerar dados para dashboard
  static async gerarDadosDashboard(periodo = 30) {
    try {
      const [resumoVendas, produtosMaisVendidos, vendasPorPeriodo, estoqueBaixo] = await Promise.all([
        RelatorioModel.getResumoVendas(periodo),
        RelatorioModel.getProdutosMaisVendidos(10, periodo),
        RelatorioModel.getVendasPorPeriodo(periodo),
        RelatorioModel.getRelatorioEstoqueBaixo(),
      ])

      return {
        resumo_vendas: resumoVendas,
        produtos_mais_vendidos: produtosMaisVendidos,
        vendas_por_periodo: vendasPorPeriodo,
        alertas_estoque_baixo: estoqueBaixo.slice(0, 5), // Top 5 mais críticos
        periodo_analise: periodo,
      }
    } catch (error) {
      throw new Error(`Erro ao gerar dados do dashboard: ${error.message}`)
    }
  }

  // Relatório específico de estoque baixo
  static async gerarRelatorioEstoqueBaixo() {
    try {
      const dados = await RelatorioModel.getRelatorioEstoqueBaixo()

      const resumo = {
        total_itens_criticos: dados.length,
        valor_total_reposicao: dados.reduce((sum, item) => sum + (item.valor_reposicao || 0), 0),
        deficit_total: dados.reduce((sum, item) => sum + (item.deficit || 0), 0),
      }

      return {
        dados,
        resumo,
      }
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de estoque baixo: ${error.message}`)
    }
  }
}

module.exports = RelatorioService
