const { pool } = require("../../config/database")

class DashboardService {
  // Resumo geral do sistema
  static async getResumoGeral() {
    try {
      const [totalPecas, totalClientes, totalFornecedores, totalVendasMes, totalComprasMes, alertasAtivos] =
        await Promise.all([
          pool.execute("SELECT COUNT(*) as total FROM peca WHERE status = TRUE"),
          pool.execute("SELECT COUNT(*) as total FROM cliente WHERE status = TRUE"),
          pool.execute("SELECT COUNT(*) as total FROM fornecedor WHERE status = TRUE"),
          pool.execute(`
          SELECT COUNT(*) as total, COALESCE(SUM(valor_total), 0) as valor_total
          FROM venda 
          WHERE status = 'concluida' 
          AND MONTH(data_hora) = MONTH(CURRENT_DATE()) 
          AND YEAR(data_hora) = YEAR(CURRENT_DATE())
        `),
          pool.execute(`
          SELECT COUNT(*) as total, COALESCE(SUM(valor_total), 0) as valor_total
          FROM compra 
          WHERE status = 'recebida' 
          AND MONTH(data_compra) = MONTH(CURRENT_DATE()) 
          AND YEAR(data_compra) = YEAR(CURRENT_DATE())
        `),
          pool.execute(
            "SELECT COUNT(*) as total FROM peca WHERE quantidade_estoque <= quantidade_minima AND status = TRUE",
          ),
        ])

      return {
        pecas: {
          total: totalPecas[0][0].total,
          estoque_baixo: alertasAtivos[0][0].total,
        },
        clientes: {
          total: totalClientes[0][0].total,
        },
        fornecedores: {
          total: totalFornecedores[0][0].total,
        },
        vendas_mes: {
          quantidade: totalVendasMes[0][0].total,
          valor_total: Number.parseFloat(totalVendasMes[0][0].valor_total) || 0,
        },
        compras_mes: {
          quantidade: totalComprasMes[0][0].total,
          valor_total: Number.parseFloat(totalComprasMes[0][0].valor_total) || 0,
        },
        alertas: {
          estoque_baixo: alertasAtivos[0][0].total,
        },
      }
    } catch (error) {
      throw new Error(`Erro ao buscar resumo geral: ${error.message}`)
    }
  }

  // Atividades recentes do sistema
  static async getAtividadesRecentes(limite = 10) {
    try {
      const query = `
        (SELECT 'venda' as tipo, venda_id as id, data_hora as data, 
                CONCAT('Venda #', venda_id, ' - R$ ', FORMAT(valor_total, 2)) as descricao,
                status
         FROM venda 
         ORDER BY data_hora DESC LIMIT ?)
        UNION ALL
        (SELECT 'compra' as tipo, compra_id as id, data_compra as data,
                CONCAT('Compra #', compra_id, ' - R$ ', FORMAT(valor_total, 2)) as descricao,
                status
         FROM compra 
         ORDER BY data_compra DESC LIMIT ?)
        ORDER BY data DESC
        LIMIT ?
      `

      const [results] = await pool.execute(query, [limite, limite, limite])

      return results.map((atividade) => ({
        ...atividade,
        data_formatada: new Date(atividade.data).toLocaleString("pt-BR"),
      }))
    } catch (error) {
      throw new Error(`Erro ao buscar atividades recentes: ${error.message}`)
    }
  }

  // Gráfico de vendas dos últimos 7 dias
  static async getGraficoVendas(dias = 7) {
    try {
      const query = `
        SELECT 
          DATE(data_hora) as data,
          COUNT(*) as quantidade_vendas,
          COALESCE(SUM(valor_total), 0) as valor_total
        FROM venda 
        WHERE data_hora >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
        AND status = 'concluida'
        GROUP BY DATE(data_hora)
        ORDER BY data ASC
      `

      const [results] = await pool.execute(query, [dias])

      // Preencher dias sem vendas com zero
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)

      const dadosCompletos = []
      for (let i = 0; i < dias; i++) {
        const data = new Date(dataInicio)
        data.setDate(data.getDate() + i)
        const dataStr = data.toISOString().split("T")[0]

        const vendaDia = results.find((v) => v.data.toISOString().split("T")[0] === dataStr)

        dadosCompletos.push({
          data: dataStr,
          data_formatada: data.toLocaleDateString("pt-BR"),
          quantidade_vendas: vendaDia ? vendaDia.quantidade_vendas : 0,
          valor_total: vendaDia ? Number.parseFloat(vendaDia.valor_total) : 0,
        })
      }

      return dadosCompletos
    } catch (error) {
      throw new Error(`Erro ao buscar gráfico de vendas: ${error.message}`)
    }
  }

  // Top 5 produtos mais vendidos
  static async getTopProdutos(limite = 5) {
    try {
      const query = `
        SELECT 
          p.nome,
          p.peca_id,
          SUM(iv.quantidade) as total_vendido,
          SUM(iv.quantidade * iv.valor_unitario) as receita_total
        FROM item_venda iv
        JOIN peca p ON iv.peca_id = p.peca_id
        JOIN venda v ON iv.venda_id = v.venda_id
        WHERE v.status = 'concluida'
        AND v.data_hora >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY p.peca_id, p.nome
        ORDER BY total_vendido DESC
        LIMIT ?
      `

      const [results] = await pool.execute(query, [limite])

      return results.map((produto) => ({
        ...produto,
        receita_total: Number.parseFloat(produto.receita_total) || 0,
      }))
    } catch (error) {
      throw new Error(`Erro ao buscar top produtos: ${error.message}`)
    }
  }

  // Dados completos do dashboard
  static async getDadosCompletos() {
    try {
      const [resumo, atividades, graficoVendas, topProdutos] = await Promise.all([
        this.getResumoGeral(),
        this.getAtividadesRecentes(8),
        this.getGraficoVendas(7),
        this.getTopProdutos(5),
      ])

      return {
        resumo,
        atividades_recentes: atividades,
        grafico_vendas: graficoVendas,
        top_produtos: topProdutos,
        ultima_atualizacao: new Date().toLocaleString("pt-BR"),
      }
    } catch (error) {
      throw new Error(`Erro ao buscar dados do dashboard: ${error.message}`)
    }
  }
}

module.exports = DashboardService
