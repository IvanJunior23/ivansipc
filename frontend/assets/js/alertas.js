// Declare the auth variable before using it
window.auth = {
  initialized: false,
  isAuthenticated: () => localStorage.getItem("token") !== null,
  getCurrentUser: async () => {
    // Mock implementation for demonstration purposes
    return { nome: "John Doe", tipo_usuario: "admin" }
  },
  logout: () => {
    localStorage.removeItem("token")
    window.location.href = "login.html"
  },
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log(" === INICIANDO ALERTAS ===")
  await loadAlerts()
  setupEventListeners()

  // Refresh alerts every 2 minutes
  setInterval(loadAlerts, 120000)
})

function setupEventListeners() {
  // Filter change listeners
  const filterTipo = document.getElementById("filter-tipo")
  const filterPrioridade = document.getElementById("filter-prioridade")

  if (filterTipo) filterTipo.addEventListener("change", loadAlerts)
  if (filterPrioridade) filterPrioridade.addEventListener("change", loadAlerts)
}

async function loadAlerts() {
  try {
    console.log(" Carregando alertas...")
    const token = getToken()
    if (!token) return

    const filterTipo = document.getElementById("filter-tipo")?.value || ""
    const filterPrioridade = document.getElementById("filter-prioridade")?.value || ""

    let endpoint = "/api/alertas/recompra"

    if (filterTipo === "estoque_baixo") {
      endpoint = "/api/alertas/estoque-baixo"
    } else if (filterTipo === "venda_pendente") {
      endpoint = "/api/alertas/vendas-pendentes"
    } else if (filterTipo === "compra_pendente") {
      endpoint = "/api/alertas/compras-pendentes"
    } else if (filterTipo === "recompra" || filterTipo === "") {
      endpoint = "/api/alertas/recompra"
    }

    console.log(" Endpoint:", endpoint)

    const [alertsResponse, statsResponse] = await Promise.all([
      fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/alertas/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    console.log(" Alerts response status:", alertsResponse.status)
    console.log(" Stats response status:", statsResponse.status)

    if (alertsResponse.ok && statsResponse.ok) {
      const alertsData = await alertsResponse.json()
      const statsData = await statsResponse.json()

      console.log(" Alerts data:", alertsData)
      console.log(" Stats data:", statsData)

      renderStats(statsData.data)

      let filteredAlerts = alertsData.data || []
      console.log(" Total alerts:", filteredAlerts.length)

      if (filterPrioridade && filterTipo !== "venda_pendente" && filterTipo !== "compra_pendente") {
        filteredAlerts = filteredAlerts.filter((alert) => {
          if (filterPrioridade === "critical") return alert.quantidade_estoque === 0
          if (filterPrioridade === "warning")
            return alert.quantidade_estoque > 0 && alert.quantidade_estoque <= alert.quantidade_minima
          return true
        })
      }

      if (filterTipo === "venda_pendente") {
        renderPendingSalesAlerts(filteredAlerts)
      } else if (filterTipo === "compra_pendente") {
        renderPendingPurchasesAlerts(filteredAlerts)
      } else {
        renderReorderAlerts(filteredAlerts)
      }
    } else {
      console.error(" Erro ao carregar alertas - Status:", alertsResponse.status)
      const errorText = await alertsResponse.text()
      console.error(" Error response:", errorText)
      showError("Erro ao carregar alertas")
    }
  } catch (error) {
    console.error(" Erro ao carregar alertas:", error)
    showError("Erro ao carregar alertas: " + error.message)
  }
}

function renderStats(stats) {
  const container = document.getElementById("alert-stats")
  if (!container) return

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon critical">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <div class="stat-info">
        <h3>${stats.critical || 0}</h3>
        <p>Estoque Zerado</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon warning">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="stat-info">
        <h3>${stats.warning || 0}</h3>
        <p>Estoque Baixo</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon info">
        <i class="fas fa-info-circle"></i>
      </div>
      <div class="stat-info">
        <h3>${stats.info || 0}</h3>
        <p>Pendências</p>
      </div>
    </div>
  `
}

function renderPendingSalesAlerts(alerts) {
  const container = document.getElementById("alerts-container")
  if (!container) return

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check-circle"></i>
        <h3>Nenhuma venda pendente</h3>
        <p>Todas as vendas foram finalizadas.</p>
      </div>
    `
    return
  }

  container.innerHTML = alerts
    .map((alert) => {
      const dataVenda = new Date(alert.data_hora).toLocaleString("pt-BR")
      const valorTotal = alert.valor_total ? `R$ ${Number.parseFloat(alert.valor_total).toFixed(2)}` : "N/A"

      return `
        <div class="alert-item">
          <div class="alert-priority info"></div>
          <div class="alert-icon info">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="alert-content">
            <div class="alert-title">
              Venda #${alert.venda_id} - ${alert.cliente_nome || "Cliente não identificado"}
            </div>
            <div class="alert-description">
              <strong>Valor Total:</strong> ${valorTotal} | 
              <strong>Data:</strong> ${dataVenda}
            </div>
            <div class="alert-description">
              <strong>Vendedor:</strong> ${alert.vendedor_email || "N/A"}
            </div>
            <div class="alert-meta">
              <span><i class="fas fa-clock"></i> Aguardando finalização</span>
              <span><i class="fas fa-tag"></i> Status: Pendente</span>
            </div>
          </div>
          <div class="alert-actions">
            <button class="btn-action btn-resolve" onclick="finalizarVenda(${alert.venda_id})" title="Finalizar venda">
              <i class="fas fa-check"></i> Finalizar
            </button>
            <button class="btn-action btn-dismiss" onclick="visualizarVenda(${alert.venda_id})" title="Ver detalhes">
              <i class="fas fa-eye"></i> Ver
            </button>
          </div>
        </div>
      `
    })
    .join("")
}

function renderReorderAlerts(alerts) {
  const container = document.getElementById("alerts-container")
  if (!container) return

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check-circle"></i>
        <h3>Nenhum alerta de recompra</h3>
        <p>Todos os itens estão com estoque adequado.</p>
      </div>
    `
    return
  }

  container.innerHTML = alerts
    .map((alert) => {
      const prioridade = alert.quantidade_estoque === 0 ? "critical" : "warning"
      const icon = alert.quantidade_estoque === 0 ? "exclamation-circle" : "exclamation-triangle"
      const ultimoPreco = alert.ultimo_preco ? `R$ ${Number.parseFloat(alert.ultimo_preco).toFixed(2)}` : "N/A"
      const dataUltimaCompra = alert.data_ultima_compra
        ? new Date(alert.data_ultima_compra).toLocaleDateString("pt-BR")
        : "Nunca"

      return `
        <div class="alert-item">
          <div class="alert-priority ${prioridade}"></div>
          <div class="alert-icon ${prioridade}">
            <i class="fas fa-${icon}"></i>
          </div>
          <div class="alert-content">
            <div class="alert-title">
              ${alert.nome} (${alert.codigo})
              ${alert.quantidade_estoque === 0 ? '<span style="color: #e74c3c; font-weight: bold;"> - ESTOQUE ZERADO</span>' : ""}
            </div>
            <div class="alert-description">
              <strong>Estoque:</strong> ${alert.quantidade_estoque} / Mínimo: ${alert.quantidade_minima} | 
              <strong>Sugestão:</strong> Comprar ${alert.quantidade_sugerida} unidades
            </div>
            <div class="alert-description">
              ${
                alert.fornecedor_preferencial
                  ? `<strong>Fornecedor:</strong> ${alert.fornecedor_preferencial} ${alert.fornecedor_telefone ? `(${alert.fornecedor_telefone})` : ""}`
                  : '<strong>Fornecedor:</strong> <span style="color: #e74c3c;">Não definido</span>'
              }
            </div>
            <div class="alert-description">
              <strong>Último preço:</strong> ${ultimoPreco} | 
              <strong>Última compra:</strong> ${dataUltimaCompra}
            </div>
            <div class="alert-meta">
              <span><i class="fas fa-tag"></i> ${alert.categoria_nome || "Sem categoria"}</span>
              <span><i class="fas fa-copyright"></i> ${alert.marca_nome || "Sem marca"}</span>
            </div>
          </div>
          <div class="alert-actions">
            <button class="btn-action btn-resolve" onclick="criarCompraRapida(${alert.peca_id}, ${alert.fornecedor_id || "null"}, ${alert.quantidade_sugerida})" title="Criar compra">
              <i class="fas fa-shopping-cart"></i> Comprar
            </button>
          </div>
        </div>
      `
    })
    .join("")
}

function renderPendingPurchasesAlerts(alerts) {
  const container = document.getElementById("alerts-container")
  if (!container) return

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check-circle"></i>
        <h3>Nenhuma compra pendente</h3>
        <p>Todas as compras foram recebidas.</p>
      </div>
    `
    return
  }

  container.innerHTML = alerts
    .map((alert) => {
      const dataCompra = new Date(alert.data_compra).toLocaleString("pt-BR")
      const valorTotal = alert.valor_total ? `R$ ${Number.parseFloat(alert.valor_total).toFixed(2)}` : "N/A"

      return `
        <div class="alert-item">
          <div class="alert-priority info"></div>
          <div class="alert-icon info">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <div class="alert-content">
            <div class="alert-title">
              Compra #${alert.compra_id} - ${alert.fornecedor_nome || "Fornecedor não identificado"}
            </div>
            <div class="alert-description">
              <strong>Valor Total:</strong> ${valorTotal} | 
              <strong>Data:</strong> ${dataCompra}
            </div>
            <div class="alert-description">
              <strong>Usuário:</strong> ${alert.usuario_email || "N/A"}
            </div>
            <div class="alert-meta">
              <span><i class="fas fa-clock"></i> Aguardando recebimento</span>
              <span><i class="fas fa-tag"></i> Status: Pendente</span>
            </div>
          </div>
          <div class="alert-actions">
            <button class="btn-action btn-resolve" onclick="receberCompra(${alert.compra_id})" title="Receber compra">
              <i class="fas fa-check"></i> Receber
            </button>
            <button class="btn-action btn-dismiss" onclick="visualizarCompra(${alert.compra_id})" title="Ver detalhes">
              <i class="fas fa-eye"></i> Ver
            </button>
          </div>
        </div>
      `
    })
    .join("")
}

async function finalizarVenda(vendaId) {
  if (!confirm("Deseja finalizar esta venda? O estoque será reduzido.")) {
    return
  }

  try {
    const token = getToken()
    const response = await fetch(`/api/vendas/${vendaId}/finalizar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (response.ok) {
      alert("Venda finalizada com sucesso!")
      loadAlerts() // Refresh alerts
    } else {
      alert("Erro ao finalizar venda: " + (result.message || "Erro desconhecido"))
    }
  } catch (error) {
    console.error(" Erro ao finalizar venda:", error)
    alert("Erro ao finalizar venda")
  }
}

function visualizarVenda(vendaId) {
  window.location.href = `vendas.html?id=${vendaId}`
}

async function receberCompra(compraId) {
  if (!confirm("Deseja receber esta compra? O estoque será atualizado.")) {
    return
  }

  try {
    const token = getToken()
    const response = await fetch(`/api/compras/${compraId}/receber`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (response.ok) {
      alert("Compra recebida com sucesso!")
      loadAlerts()
    } else {
      alert("Erro ao receber compra: " + (result.message || "Erro desconhecido"))
    }
  } catch (error) {
    console.error(" Erro ao receber compra:", error)
    alert("Erro ao receber compra")
  }
}

function visualizarCompra(compraId) {
  window.location.href = `compras.html?id=${compraId}`
}

function refreshAlerts() {
  loadAlerts()
}

function filterAlerts() {
  loadAlerts()
}

function getToken() {
  const token = localStorage.getItem("token")
  if (!token) {
    console.warn(" Token não encontrado, redirecionando para login...")
    window.location.href = "/login.html"
    return null
  }
  return token.trim()
}

async function criarCompraRapida(pecaId, fornecedorId, quantidadeSugerida) {
  if (!fornecedorId) {
    alert("Esta peça não tem um fornecedor definido. Por favor, cadastre um fornecedor primeiro.")
    return
  }

  const quantidade = prompt(`Quantidade a comprar (sugerido: ${quantidadeSugerida}):`, quantidadeSugerida)
  if (!quantidade || quantidade <= 0) return

  try {
    const token = getToken()
    const response = await fetch("/api/compras", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fornecedor_id: fornecedorId,
        itens: [
          {
            peca_id: pecaId,
            quantidade: Number.parseInt(quantidade),
          },
        ],
      }),
    })

    const result = await response.json()

    if (response.ok) {
      alert("Compra criada com sucesso!")
      loadAlerts()
    } else {
      alert("Erro ao criar compra: " + (result.message || "Erro desconhecido"))
    }
  } catch (error) {
    console.error(" Erro ao criar compra:", error)
    alert("Erro ao criar compra: " + error.message)
  }
}

function showSuccess(message) {
  console.log(" Success:", message)
  alert(message)
}

function showError(message) {
  console.error(" Error:", message)
  alert(message)
}
