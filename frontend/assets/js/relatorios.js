document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== INICIANDO RELATÓRIOS ===")

  const auth = window.auth // Declare the auth variable here

  if (!auth.initialized) {
    setTimeout(async () => {
      await initRelatorios()
    }, 500)
  } else {
    await initRelatorios()
  }

  async function initRelatorios() {
    if (!auth.isAuthenticated()) {
      window.location.href = "/login.html"
      return
    }

    try {
      const userData = await auth.getCurrentUser()
      updateUserInfo(userData)
      buildDynamicMenu(userData.tipo_usuario || "vendedor")
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      buildDynamicMenu("vendedor")
    }

    setupEventListeners()
    await loadCurrentReport()
    addLogoutButton()
  }

  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const tabName = this.dataset.tab
        switchTab(tabName)
      })
    })

    // Period filter
    document.getElementById("filter-periodo").addEventListener("change", function () {
      const isCustom = this.value === "personalizado"
      document.getElementById("data-inicio-group").style.display = isCustom ? "flex" : "none"
      document.getElementById("data-fim-group").style.display = isCustom ? "flex" : "none"
    })

    // Apply filters
    document.getElementById("aplicar-filtros").addEventListener("click", loadCurrentReport)
  }

  function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab panels
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.remove("active")
    })
    document.getElementById(`tab-${tabName}`).classList.add("active")

    // Load report data
    loadReportData(tabName)
  }

  async function loadCurrentReport() {
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab
    await loadReportData(activeTab)
  }

  async function loadReportData(reportType) {
    try {
      showLoading(reportType)

      const filters = getFilters()
      const queryParams = new URLSearchParams(filters)

      const response = await fetch(`/api/relatorios/${reportType}?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (response.ok) {
        const data = await response.json()
        renderReport(reportType, data)
      } else {
        showError(`Erro ao carregar relatório de ${reportType}`)
      }
    } catch (error) {
      console.error(`Erro ao carregar relatório de ${reportType}:`, error)
      showError(`Erro ao carregar relatório de ${reportType}`)
    }
  }

  function getFilters() {
    const periodo = document.getElementById("filter-periodo").value
    const filters = { periodo }

    if (periodo === "personalizado") {
      filters.dataInicio = document.getElementById("data-inicio").value
      filters.dataFim = document.getElementById("data-fim").value
    }

    return filters
  }

  function showLoading(reportType) {
    const panel = document.getElementById(`tab-${reportType}`)
    const content = panel.querySelector(".report-table tbody") || panel.querySelector(".summary-cards")
    if (content) {
      content.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner"></i>
                    <p>Carregando relatório...</p>
                </div>
            `
    }
  }

  function renderReport(reportType, data) {
    switch (reportType) {
      case "vendas":
        renderVendasReport(data)
        break
      case "estoque":
        renderEstoqueReport(data)
        break
      case "clientes":
        renderClientesReport(data)
        break
      case "financeiro":
        renderFinanceiroReport(data)
        break
    }
  }

  function renderVendasReport(data) {
    // Render summary cards
    const summaryContainer = document.getElementById("vendas-summary")
    summaryContainer.innerHTML = `
            <div class="summary-card">
                <h4>Total de Vendas</h4>
                <div class="value">${data.summary.totalVendas || 0}</div>
            </div>
            <div class="summary-card">
                <h4>Receita Total</h4>
                <div class="value">R$ ${formatCurrency(data.summary.receitaTotal || 0)}</div>
            </div>
            <div class="summary-card">
                <h4>Ticket Médio</h4>
                <div class="value">R$ ${formatCurrency(data.summary.ticketMedio || 0)}</div>
            </div>
            <div class="summary-card">
                <h4>Itens Vendidos</h4>
                <div class="value">${data.summary.itensVendidos || 0}</div>
            </div>
        `

    // Render chart
    renderChart("vendas-chart", data.chartData || [])

    // Render table
    const tableBody = document.querySelector("#vendas-table tbody")
    if (data.vendas && data.vendas.length > 0) {
      tableBody.innerHTML = data.vendas
        .map(
          (venda) => `
                <tr>
                    <td>${formatDate(venda.data_venda)}</td>
                    <td>#${venda.id}</td>
                    <td>${venda.cliente_nome}</td>
                    <td>${venda.total_itens}</td>
                    <td>R$ ${formatCurrency(venda.total)}</td>
                    <td><span class="status-badge status-${venda.status}">${venda.status}</span></td>
                </tr>
            `,
        )
        .join("")
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma venda encontrada no período</td></tr>'
    }
  }

  function renderEstoqueReport(data) {
    // Render summary cards
    const summaryContainer = document.getElementById("estoque-summary")
    summaryContainer.innerHTML = `
            <div class="summary-card">
                <h4>Total de Peças</h4>
                <div class="value">${data.summary.totalPecas || 0}</div>
            </div>
            <div class="summary-card">
                <h4>Valor do Estoque</h4>
                <div class="value">R$ ${formatCurrency(data.summary.valorEstoque || 0)}</div>
            </div>
            <div class="summary-card">
                <h4>Estoque Baixo</h4>
                <div class="value">${data.summary.estoqueBaixo || 0}</div>
            </div>
            <div class="summary-card">
                <h4>Sem Estoque</h4>
                <div class="value">${data.summary.semEstoque || 0}</div>
            </div>
        `

    // Render table
    const tableBody = document.querySelector("#estoque-table tbody")
    if (data.estoque && data.estoque.length > 0) {
      tableBody.innerHTML = data.estoque
        .map(
          (item) => `
                <tr>
                    <td>${item.nome}</td>
                    <td>${item.categoria}</td>
                    <td>${item.marca}</td>
                    <td>${item.quantidade_estoque}</td>
                    <td>${item.estoque_minimo}</td>
                    <td>R$ ${formatCurrency(item.preco_venda)}</td>
                    <td>R$ ${formatCurrency(item.valor_total)}</td>
                    <td>
                        <span class="status-badge ${getEstoqueStatus(item.quantidade_estoque, item.estoque_minimo)}">
                            ${getEstoqueStatusText(item.quantidade_estoque, item.estoque_minimo)}
                        </span>
                    </td>
                </tr>
            `,
        )
        .join("")
    } else {
      tableBody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhum item no estoque</td></tr>'
    }
  }

  function renderClientesReport(data) {
    // Render summary cards
    const summaryContainer = document.getElementById("clientes-summary")
    summaryContainer.innerHTML = `
            <div class="summary-card">
                <h4>Total de Clientes</h4>
                <div class="value">${data.summary.totalClientes || 0}</div>
            </div>
            <div class="summary-card">
                <h4>Clientes Ativos</h4>
                <div class="value">${data.summary.clientesAtivos || 0}</div>
            </div>
            <div class="summary-card">
                <h4>Novos Clientes</h4>
                <div class="value">${data.summary.novosClientes || 0}</div>
            </div>
            <div class="summary-card">
                <h4>Ticket Médio</h4>
                <div class="value">R$ ${formatCurrency(data.summary.ticketMedio || 0)}</div>
            </div>
        `

    // Render table
    const tableBody = document.querySelector("#clientes-table tbody")
    if (data.clientes && data.clientes.length > 0) {
      tableBody.innerHTML = data.clientes
        .map(
          (cliente) => `
                <tr>
                    <td>${cliente.nome}</td>
                    <td>${cliente.tipo_pessoa === "F" ? "Física" : "Jurídica"}</td>
                    <td>${cliente.total_compras}</td>
                    <td>R$ ${formatCurrency(cliente.valor_total)}</td>
                    <td>${cliente.ultima_compra ? formatDate(cliente.ultima_compra) : "Nunca"}</td>
                    <td>
                        <span class="status-badge ${cliente.ativo ? "status-ativo" : "status-inativo"}">
                            ${cliente.ativo ? "Ativo" : "Inativo"}
                        </span>
                    </td>
                </tr>
            `,
        )
        .join("")
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum cliente encontrado</td></tr>'
    }
  }

  function renderFinanceiroReport(data) {
    // Render summary cards
    const summaryContainer = document.getElementById("financeiro-summary")
    summaryContainer.innerHTML = `
            <div class="summary-card">
                <h4>Receita Total</h4>
                <div class="value">R$ ${formatCurrency(data.summary.receitaTotal || 0)}</div>
            </div>
            <div class="summary-card">
                <h4>Custos Totais</h4>
                <div class="value">R$ ${formatCurrency(data.summary.custosTotal || 0)}</div>
            </div>
            <div class="summary-card">
                <h4>Lucro Bruto</h4>
                <div class="value">R$ ${formatCurrency(data.summary.lucroBruto || 0)}</div>
            </div>
            <div class="summary-card">
                <h4>Margem de Lucro</h4>
                <div class="value">${(data.summary.margemLucro || 0).toFixed(1)}%</div>
            </div>
        `

    // Render chart
    renderChart("financeiro-chart", data.chartData || [])

    // Render table
    const tableBody = document.querySelector("#financeiro-table tbody")
    if (data.financeiro && data.financeiro.length > 0) {
      tableBody.innerHTML = data.financeiro
        .map(
          (item) => `
                <tr>
                    <td>${item.periodo}</td>
                    <td>R$ ${formatCurrency(item.receita)}</td>
                    <td>R$ ${formatCurrency(item.custos)}</td>
                    <td>R$ ${formatCurrency(item.lucro_bruto)}</td>
                    <td>${item.margem.toFixed(1)}%</td>
                </tr>
            `,
        )
        .join("")
    } else {
      tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum dado financeiro encontrado</td></tr>'
    }
  }

  function renderChart(containerId, data) {
    const container = document.getElementById(containerId)
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="empty-state">Sem dados para exibir</div>'
      return
    }

    const maxValue = Math.max(...data.map((d) => d.valor))
    container.innerHTML = data
      .map((item) => {
        const height = (item.valor / maxValue) * 250
        return `
                <div class="chart-bar" style="height: ${height}px;">
                    <div class="chart-bar-value">R$ ${formatCurrency(item.valor)}</div>
                    <div class="chart-bar-label">${item.label}</div>
                </div>
            `
      })
      .join("")
  }

  function getEstoqueStatus(atual, minimo) {
    if (atual === 0) return "status-sem-estoque"
    if (atual <= minimo) return "status-estoque-baixo"
    return "status-estoque-ok"
  }

  function getEstoqueStatusText(atual, minimo) {
    if (atual === 0) return "Sem Estoque"
    if (atual <= minimo) return "Estoque Baixo"
    return "Normal"
  }

  function formatCurrency(value) {
    return Number.parseFloat(value || 0)
      .toFixed(2)
      .replace(".", ",")
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  // Global export function
  window.exportReport = async (reportType, format) => {
    try {
      const filters = getFilters()
      const queryParams = new URLSearchParams({ ...filters, format })

      const response = await fetch(`/api/relatorios/${reportType}/export?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `relatorio_${reportType}_${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        showError("Erro ao exportar relatório")
      }
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      showError("Erro ao exportar relatório")
    }
  }


  function updateUserInfo(user) {
    const userNameEl = document.querySelector(".user-name")
    const userRoleEl = document.querySelector(".user-role")
    if (userNameEl && userRoleEl) {
      userNameEl.textContent = user.nome || "Usuário"
      userRoleEl.textContent = user.tipo_usuario
        ? user.tipo_usuario.charAt(0).toUpperCase() + user.tipo_usuario.slice(1)
        : "Usuário"
    }
  }

  function addLogoutButton() {
    const userInfo = document.querySelector(".user-info")
    if (userInfo && !userInfo.querySelector(".logout-btn")) {
      const logoutBtn = document.createElement("button")
      logoutBtn.className = "logout-btn"
      logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'
      logoutBtn.onclick = () => auth.logout()
      logoutBtn.style.cssText =
        "margin-top: 10px; padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;"
      userInfo.appendChild(logoutBtn)
    }
  }

  function showError(message) {
    console.error("Error:", message)
  }
})
