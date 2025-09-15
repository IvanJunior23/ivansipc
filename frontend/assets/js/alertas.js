// Declare the auth variable before using it
const auth = {
  initialized: false,
  isAuthenticated: () => localStorage.getItem("token") !== null,
  getCurrentUser: async () => {
    // Mock implementation for demonstration purposes
    return { nome: "John Doe", tipo_usuario: "admin" }
  },
  logout: () => {
    localStorage.removeItem("token")
    window.location.href = "/login.html"
  },
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== INICIANDO ALERTAS ===")

  if (!auth.initialized) {
    setTimeout(async () => {
      await initAlertas()
    }, 500)
  } else {
    await initAlertas()
  }

  async function initAlertas() {
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

    await loadAlerts()
    setupEventListeners()
    addLogoutButton()

    // Auto refresh every 30 seconds
    setInterval(loadAlerts, 30000)
  }

  function setupEventListeners() {
    // Filter change listeners
    document.getElementById("filter-tipo").addEventListener("change", loadAlerts)
    document.getElementById("filter-prioridade").addEventListener("change", loadAlerts)
    document.getElementById("filter-status").addEventListener("change", loadAlerts)

    // Refresh button
    document.getElementById("refresh-alerts").addEventListener("click", async function () {
      this.classList.add("loading")
      this.disabled = true
      await loadAlerts()
      this.classList.remove("loading")
      this.disabled = false
    })
  }

  async function loadAlerts() {
    try {
      const filters = {
        tipo: document.getElementById("filter-tipo").value,
        prioridade: document.getElementById("filter-prioridade").value,
        status: document.getElementById("filter-status").value,
      }

      const queryParams = new URLSearchParams()
      Object.keys(filters).forEach((key) => {
        if (filters[key]) queryParams.append(key, filters[key])
      })

      const [alertsResponse, statsResponse] = await Promise.all([
        fetch(`/api/alertas?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch("/api/alertas/stats", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ])

      if (alertsResponse.ok && statsResponse.ok) {
        const alerts = await alertsResponse.json()
        const stats = await statsResponse.json()

        renderStats(stats)
        renderAlerts(alerts)
      } else {
        showError("Erro ao carregar alertas")
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
      showError("Erro ao carregar alertas")
    }
  }

  function renderStats(stats) {
    const container = document.getElementById("alert-stats")
    container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon critical">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.critical || 0}</h3>
                    <p>Alertas Críticos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon warning">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.warning || 0}</h3>
                    <p>Avisos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon info">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.info || 0}</h3>
                    <p>Informações</p>
                </div>
            </div>
        `
  }

  function renderAlerts(alerts) {
    const container = document.getElementById("alerts-container")

    if (!alerts || alerts.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>Nenhum alerta encontrado</h3>
                    <p>Não há alertas ativos no momento.</p>
                </div>
            `
      return
    }

    container.innerHTML = alerts
      .map(
        (alert) => `
            <div class="alert-item" data-id="${alert.id}">
                <div class="alert-priority ${alert.prioridade}"></div>
                <div class="alert-icon ${alert.prioridade}">
                    <i class="fas fa-${getAlertIcon(alert.tipo)}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.titulo}</div>
                    <div class="alert-description">${alert.descricao}</div>
                    <div class="alert-meta">
                        <span><i class="fas fa-clock"></i> ${formatDate(alert.data_criacao)}</span>
                        <span><i class="fas fa-tag"></i> ${alert.tipo.replace("_", " ").toUpperCase()}</span>
                        ${alert.referencia_id ? `<span><i class="fas fa-link"></i> Ref: ${alert.referencia_id}</span>` : ""}
                    </div>
                </div>
                <div class="alert-actions">
                    ${
                      alert.status === "ativo"
                        ? `
                        <button class="btn-action btn-resolve" onclick="resolveAlert(${alert.id})">
                            <i class="fas fa-check"></i> Resolver
                        </button>
                        <button class="btn-action btn-dismiss" onclick="dismissAlert(${alert.id})">
                            <i class="fas fa-times"></i> Dispensar
                        </button>
                    `
                        : `
                        <span class="status-badge status-resolvido">Resolvido</span>
                    `
                    }
                </div>
            </div>
        `,
      )
      .join("")
  }

  function getAlertIcon(tipo) {
    const icons = {
      estoque_baixo: "boxes",
      venda_pendente: "shopping-cart",
      compra_pendente: "shopping-bag",
      sistema: "cog",
    }
    return icons[tipo] || "bell"
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`

    return date.toLocaleDateString("pt-BR")
  }

  // Global functions for alert actions
  window.resolveAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alertas/${alertId}/resolver`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        showSuccess("Alerta resolvido com sucesso")
        await loadAlerts()
      } else {
        const error = await response.json()
        showError(error.message || "Erro ao resolver alerta")
      }
    } catch (error) {
      console.error("Erro ao resolver alerta:", error)
      showError("Erro ao resolver alerta")
    }
  }

  window.dismissAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alertas/${alertId}/dispensar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        showSuccess("Alerta dispensado com sucesso")
        await loadAlerts()
      } else {
        const error = await response.json()
        showError(error.message || "Erro ao dispensar alerta")
      }
    } catch (error) {
      console.error("Erro ao dispensar alerta:", error)
      showError("Erro ao dispensar alerta")
    }
  }

  function buildDynamicMenu(userType) {
    const PERMISSIONS = {
      admin: [
        { name: "Dashboard", icon: "fas fa-home", url: "index.html" },
        { name: "Categorias", icon: "fas fa-tags", url: "categorias.html" },
        { name: "Marcas", icon: "fas fa-copyright", url: "marcas.html" },
        { name: "Peças", icon: "fas fa-microchip", url: "pecas.html" },
        { name: "Clientes", icon: "fas fa-users", url: "clientes.html" },
        { name: "Fornecedores", icon: "fas fa-truck", url: "fornecedores.html" },
        { name: "Compras", icon: "fas fa-shopping-bag", url: "compras.html" },
        { name: "Vendas", icon: "fas fa-shopping-cart", url: "vendas.html" },
        { name: "Trocas", icon: "fas fa-exchange-alt", url: "trocas.html" },
        { name: "Alertas", icon: "fas fa-bell", url: "alertas.html", active: true },
        { name: "Relatórios", icon: "fas fa-chart-bar", url: "relatorios.html" },
        { name: "FAQ", icon: "fas fa-question-circle", url: "faq.html" },
        { name: "Usuários", icon: "fas fa-user-cog", url: "usuarios.html" },
        { name: "Contatos", icon: "fas fa-address-book", url: "contatos.html" },
        { name: "Endereços", icon: "fas fa-map-marker-alt", url: "enderecos.html" },
      ],
      vendedor: [
        { name: "Dashboard", icon: "fas fa-home", url: "index.html" },
        { name: "Clientes", icon: "fas fa-users", url: "clientes.html" },
        { name: "Vendas", icon: "fas fa-shopping-cart", url: "vendas.html" },
        { name: "FAQ", icon: "fas fa-question-circle", url: "faq.html" },
      ],
      estoque: [
        { name: "Dashboard", icon: "fas fa-home", url: "index.html" },
        { name: "Categorias", icon: "fas fa-tags", url: "categorias.html" },
        { name: "Marcas", icon: "fas fa-copyright", url: "marcas.html" },
        { name: "Peças", icon: "fas fa-microchip", url: "pecas.html" },
        { name: "Fornecedores", icon: "fas fa-truck", url: "fornecedores.html" },
        { name: "Compras", icon: "fas fa-shopping-bag", url: "compras.html" },
        { name: "Alertas", icon: "fas fa-bell", url: "alertas.html", active: true },
        { name: "FAQ", icon: "fas fa-question-circle", url: "faq.html" },
      ],
    }

    const sidebar = document.getElementById("sidebar-menu")
    const normalizedType = userType.toLowerCase().trim()
    const permissions = PERMISSIONS[normalizedType] || PERMISSIONS.vendedor

    sidebar.innerHTML = ""
    permissions.forEach((item) => {
      const link = document.createElement("a")
      link.href = item.url
      link.innerHTML = `<i class="${item.icon}"></i> ${item.name}`
      if (item.active) link.classList.add("active")
      sidebar.appendChild(link)
    })
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

  function showSuccess(message) {
    // Implementation for success toast
    console.log("Success:", message)
  }

  function showError(message) {
    // Implementation for error toast
    console.error("Error:", message)
  }
})
