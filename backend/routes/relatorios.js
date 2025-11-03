const express = require("express")
const router = express.Router()
const { pool } = require("../config/database")
const RelatorioController = require("../app/controllers/relatorioController")
const { authenticateToken } = require("../middleware/auth")

// ----------------------------------------------------------------------------------
// ROTA PRINCIPAL - DASHBOARD STATS
// ----------------------------------------------------------------------------------
router.get("/dashboard-stats", authenticateToken, async (req, res) => {
  try {
    // Executar todas as consultas em paralelo para melhor performance
    const [
      produtosResult,
      clientesResult,
      fornecedoresResult,
      estoqueBaixoResult,
      vendasMesResult,
      alertasResult,
      vendasRecentesResult,
      vendasGraficoResult,
    ] = await Promise.all([
      pool.execute("SELECT COUNT(*) as totalProdutos FROM peca WHERE status = TRUE"),
      pool.execute("SELECT COUNT(*) as totalClientes FROM cliente WHERE status = TRUE"),
      pool.execute("SELECT COUNT(*) as totalFornecedores FROM fornecedor WHERE status = TRUE"),
      pool.execute(
        "SELECT COUNT(*) as totalEstoqueBaixo FROM peca WHERE quantidade_estoque <= quantidade_minima AND status = TRUE",
      ),
      pool.execute(`
                SELECT COUNT(*) as vendasMes 
                FROM venda 
                WHERE status = 'concluida' 
                AND MONTH(data_hora) = MONTH(CURRENT_DATE()) 
                AND YEAR(data_hora) = YEAR(CURRENT_DATE())
            `),
      pool.execute(`
                SELECT tipo_alerta, descricao, data_hora_geracao 
                FROM alerta 
                WHERE status = 'ativo' 
                ORDER BY data_hora_geracao DESC 
                LIMIT 5
            `),
      pool.execute(`
                SELECT 
                    v.venda_id, 
                    c.nome_completo as cliente_nome, 
                    v.valor_total, 
                    v.status,
                    v.data_hora
                FROM venda v 
                JOIN cliente cl ON v.cliente_id = cl.cliente_id 
                JOIN contato c ON cl.contato_id = c.contato_id 
                WHERE v.status IN ('concluida', 'pendente', 'cancelada')
                ORDER BY v.data_hora DESC 
                LIMIT 5
            `),
      pool.execute(`
                SELECT 
                    CASE DAYOFWEEK(data_hora)
                        WHEN 1 THEN 'Dom'
                        WHEN 2 THEN 'Seg'
                        WHEN 3 THEN 'Ter'
                        WHEN 4 THEN 'Qua'
                        WHEN 5 THEN 'Qui'
                        WHEN 6 THEN 'Sex'
                        WHEN 7 THEN 'Sáb'
                    END as dia,
                    COUNT(venda_id) as vendas 
                FROM venda 
                WHERE data_hora >= CURDATE() - INTERVAL 7 DAY 
                AND status = 'concluida' 
                GROUP BY DAYOFWEEK(data_hora), dia
                ORDER BY DAYOFWEEK(data_hora)
            `),
    ])

    // Extrair valores dos resultados
    const totalProdutos = produtosResult[0][0]?.totalProdutos || 0
    const totalClientes = clientesResult[0][0]?.totalClientes || 0
    const totalFornecedores = fornecedoresResult[0][0]?.totalFornecedores || 0
    const totalEstoqueBaixo = estoqueBaixoResult[0][0]?.totalEstoqueBaixo || 0
    const vendasMes = vendasMesResult[0][0]?.vendasMes || 0

    // Processar dados
    const data = {
      produtos: totalProdutos,
      vendas: vendasMes,
      clientes: totalClientes,
      estoqueBaixo: totalEstoqueBaixo,
      fornecedores: totalFornecedores,
      vendasRecentes: vendasRecentesResult[0].map((v) => ({
        codigo: `V${String(v.venda_id).padStart(3, "0")}`,
        cliente: v.cliente_nome,
        total: Number.parseFloat(v.valor_total),
        status: v.status,
      })),
      alertas: alertasResult[0].map((a) => {
        const dataFormatada = new Date(a.data_hora_geracao)
        const agora = new Date()
        const diffMinutos = Math.floor((agora - dataFormatada) / (1000 * 60))

        let tempoFormatado
        if (diffMinutos < 1) {
          tempoFormatado = "Agora"
        } else if (diffMinutos < 60) {
          tempoFormatado = `${diffMinutos} min atrás`
        } else if (diffMinutos < 1440) {
          const horas = Math.floor(diffMinutos / 60)
          tempoFormatado = `${horas} hora${horas > 1 ? "s" : ""} atrás`
        } else {
          tempoFormatado = dataFormatada.toLocaleDateString("pt-BR")
        }

        return {
          tipo: a.tipo_alerta === "estoque_baixo" ? "error" : "warning",
          titulo:
            a.tipo_alerta === "estoque_baixo"
              ? "Estoque Baixo"
              : a.tipo_alerta === "venda_pendente"
                ? "Venda Pendente"
                : "Alerta do Sistema",
          descricao: a.descricao,
          tempo: tempoFormatado,
        }
      }),
      vendasGrafico:
        vendasGraficoResult[0].length > 0
          ? vendasGraficoResult[0]
          : [
              { dia: "Seg", vendas: 0 },
              { dia: "Ter", vendas: 0 },
              { dia: "Qua", vendas: 0 },
              { dia: "Qui", vendas: 0 },
              { dia: "Sex", vendas: 0 },
              { dia: "Sáb", vendas: 0 },
              { dia: "Dom", vendas: 0 },
            ],
    }

    console.log("Dashboard stats enviado:", {
      produtos: data.produtos,
      vendas: data.vendas,
      clientes: data.clientes,
      alertas: data.alertas.length,
      vendasRecentes: data.vendasRecentes.length,
    })

    res.json({ success: true, data })
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor ao buscar estatísticas.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

router.get("/dashboard", authenticateToken, RelatorioController.gerarDadosDashboard)

// ----------------------------------------------------------------------------------
// ROTAS DE RELATÓRIOS
// ----------------------------------------------------------------------------------

// GET - Relatório de vendas
router.get("/vendas", authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim, status } = req.query

    let query = `
    SELECT
      DATE(v.data_hora) as data,
      COUNT(*) as total_vendas,
      SUM(v.valor_total) as faturamento,
      AVG(v.valor_total) as ticket_medio
    FROM venda v
    WHERE 1 = 1`
    const params = []

    if (status) {
      query += " AND v.status = ?"
      params.push(status)
    } else {
      query += " AND v.status = 'concluida'"
    }

    if (data_inicio && data_fim) {
      query += " AND DATE(v.data_hora) BETWEEN ? AND ?"
      params.push(data_inicio, data_fim)
    } else {
      // Se não especificar datas, pegar últimos 30 dias
      query += " AND v.data_hora >= CURDATE() - INTERVAL 30 DAY"
    }

    query += " GROUP BY DATE(v.data_hora) ORDER BY data DESC"

    const [rows] = await pool.execute(query, params)

    // Formatar os valores
    const formattedRows = rows.map((row) => ({
      ...row,
      faturamento: Number.parseFloat(row.faturamento) || 0,
      ticket_medio: Number.parseFloat(row.ticket_medio) || 0,
    }))

    res.json({ success: true, data: formattedRows })
  } catch (error) {
    console.error("Erro ao gerar relatório de vendas:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório de vendas",
    })
  }
})

router.get("/vendas-detalhado", authenticateToken, RelatorioController.gerarRelatorioVendas)

// GET - Peças mais vendidas
router.get("/pecas-mais-vendidas", authenticateToken, async (req, res) => {
  try {
    const { limite = 10 } = req.query

    const [rows] = await pool.execute(
      `
            SELECT 
                p.nome, 
                p.codigo_produto,
                SUM(iv.quantidade) as total_vendido, 
                SUM(iv.quantidade * iv.valor_unitario) as receita_total,
                AVG(iv.valor_unitario) as preco_medio
            FROM item_venda iv
            JOIN peca p ON iv.peca_id = p.peca_id
            JOIN venda v ON iv.venda_id = v.venda_id
            WHERE v.status = 'concluida'
            GROUP BY p.peca_id, p.nome, p.codigo_produto
            ORDER BY total_vendido DESC
            LIMIT ?
        `,
      [Number.parseInt(limite)],
    )

    const formattedRows = rows.map((row) => ({
      ...row,
      receita_total: Number.parseFloat(row.receita_total) || 0,
      preco_medio: Number.parseFloat(row.preco_medio) || 0,
    }))

    res.json({ success: true, data: formattedRows })
  } catch (error) {
    console.error("Erro ao buscar peças mais vendidas:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao buscar peças mais vendidas",
    })
  }
})

// GET - Relatório de estoque baixo
router.get("/estoque-baixo", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
            SELECT 
                p.nome, 
                p.codigo_produto,
                p.quantidade_estoque, 
                p.quantidade_minima, 
                c.nome as categoria,
                (p.quantidade_minima - p.quantidade_estoque) as deficit,
                CASE 
                    WHEN p.quantidade_estoque = 0 THEN 'ZERADO'
                    WHEN p.quantidade_estoque <= (p.quantidade_minima * 0.5) THEN 'CRÍTICO'
                    ELSE 'BAIXO'
                END as nivel_alerta
            FROM peca p
            LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
            WHERE p.quantidade_estoque <= p.quantidade_minima 
            AND p.status = TRUE
            ORDER BY nivel_alerta DESC, p.quantidade_estoque ASC
        `)

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error("Erro ao gerar relatório de estoque baixo:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório de estoque baixo",
    })
  }
})

router.get("/estoque", authenticateToken, RelatorioController.gerarRelatorioEstoque)
router.get("/estoque-baixo-detalhado", authenticateToken, RelatorioController.gerarRelatorioEstoqueBaixo)

// GET - Relatório de clientes
router.get("/clientes", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
            SELECT 
                p.nome as nome_completo,
                cont.email,
                cont.telefone,
                COUNT(v.venda_id) as total_compras,
                COALESCE(SUM(v.valor_total), 0) as valor_total_compras,
                MAX(v.data_hora) as ultima_compra,
                p.tipo_pessoa,
                c.status as ativo
            FROM cliente c
            JOIN pessoa p ON c.pessoa_id = p.pessoa_id
            LEFT JOIN contato cont ON c.contato_id = cont.contato_id
            LEFT JOIN venda v ON c.cliente_id = v.cliente_id AND v.status = 'concluida'
            WHERE c.status = TRUE
            GROUP BY c.cliente_id, p.nome, cont.email, cont.telefone, p.tipo_pessoa, c.status
            ORDER BY valor_total_compras DESC
        `)

    const formattedRows = rows.map((row) => ({
      ...row,
      valor_total_compras: Number.parseFloat(row.valor_total_compras) || 0,
      ultima_compra: row.ultima_compra ? new Date(row.ultima_compra).toLocaleDateString("pt-BR") : "Nunca",
    }))

    res.json({ success: true, data: formattedRows })
  } catch (error) {
    console.error("Erro ao gerar relatório de clientes:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório de clientes",
    })
  }
})

router.get("/clientes-detalhado", authenticateToken, RelatorioController.gerarRelatorioClientes)
router.get("/financeiro", authenticateToken, RelatorioController.gerarRelatorioFinanceiro)

module.exports = router
