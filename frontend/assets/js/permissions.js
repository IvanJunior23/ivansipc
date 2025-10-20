const PERMISSIONS = {
  admin: {
    menu: [
      { name: "Dashboard", icon: "fas fa-home", url: "index.html", active: true },
      { name: "Categorias", icon: "fas fa-tags", url: "categorias.html" },
      { name: "Marcas", icon: "fas fa-copyright", url: "marcas.html" },
      { name: "Peças", icon: "fas fa-microchip", url: "pecas.html" },
      { name: "Clientes", icon: "fas fa-users", url: "clientes.html" },
      { name: "Fornecedores", icon: "fas fa-truck", url: "fornecedores.html" },
      { name: "Formas de Pagamento", icon: "fas fa-credit-card", url: "formas-pagamento.html" },
      { name: "Compras", icon: "fas fa-shopping-bag", url: "compras.html" },
      { name: "Vendas", icon: "fas fa-shopping-cart", url: "vendas.html" },
      { name: "Trocas", icon: "fas fa-exchange-alt", url: "trocas.html" },
      { name: "Alertas", icon: "fas fa-bell", url: "alertas.html" },
      { name: "Relatórios", icon: "fas fa-chart-bar", url: "relatorios.html" },
      { name: "Logs", icon: "fas fa-file-alt", url: "logs.html" },
      { name: "FAQ", icon: "fas fa-question-circle", url: "faq.html" },
      { name: "Usuários", icon: "fas fa-user-cog", url: "usuarios.html" },
      { name: 'Pessoas', icon: 'fas fa-user-friends', url: 'pessoas.html', active: true },
      { name: "Contatos", icon: "fas fa-address-book", url: "contatos.html" },
      { name: "Endereços", icon: "fas fa-map-marker-alt", url: "enderecos.html" },
      { name: "Imagens", icon: "fas fa-map-marker-alt", url: "imagens.html" },
    ],
    quickActions: [
      { name: "Nova Venda", icon: "fas fa-shopping-cart", url: "vendas.html" },
      { name: "Cadastrar Peça", icon: "fas fa-microchip", url: "pecas.html" },
      { name: "Cadastrar Cliente", icon: "fas fa-user-plus", url: "clientes.html" },
      { name: "Nova Compra", icon: "fas fa-shopping-bag", url: "compras.html" },
      { name: "Gerenciar Usuários", icon: "fas fa-users-cog", url: "usuarios.html" },
      { name: "Ver Alertas", icon: "fas fa-bell", url: "alertas.html" },
    ],
  },
  vendedor: {
    menu: [
      { name: "Dashboard", icon: "fas fa-home", url: "index.html", active: true },
      { name: "Clientes", icon: "fas fa-users", url: "clientes.html" },
      { name: "Peças", icon: "fas fa-microchip", url: "pecas.html", readonly: true },
      { name: "Vendas", icon: "fas fa-shopping-cart", url: "vendas.html" },
      { name: "Trocas", icon: "fas fa-exchange-alt", url: "trocas.html" },
      { name: "FAQ", icon: "fas fa-question-circle", url: "faq.html" },
      { name: 'Pessoas', icon: 'fas fa-user-friends', url: 'pessoas.html', active: true },
      { name: "Contatos", icon: "fas fa-address-book", url: "contatos.html" },
      { name: "Endereços", icon: "fas fa-map-marker-alt", url: "enderecos.html" },
    ],
    quickActions: [
      { name: "Nova Venda", icon: "fas fa-shopping-cart", url: "vendas.html" },
      { name: "Cadastrar Cliente", icon: "fas fa-user-plus", url: "clientes.html" },
      { name: "Consultar Peças", icon: "fas fa-search", url: "pecas.html" },
      { name: "Processar Troca", icon: "fas fa-exchange-alt", url: "trocas.html" },
    ],
  },
  estoque: {
    menu: [
      { name: "Dashboard", icon: "fas fa-home", url: "index.html", active: true },
      { name: "Categorias", icon: "fas fa-tags", url: "categorias.html" },
      { name: "Marcas", icon: "fas fa-copyright", url: "marcas.html" },
      { name: "Peças", icon: "fas fa-microchip", url: "pecas.html" },
      { name: "Fornecedores", icon: "fas fa-truck", url: "fornecedores.html" },
      { name: "Compras", icon: "fas fa-shopping-bag", url: "compras.html" },
      { name: "Alertas", icon: "fas fa-bell", url: "alertas.html" },
      { name: "FAQ", icon: "fas fa-question-circle", url: "faq.html" },
    ],
    quickActions: [
      { name: "Cadastrar Peça", icon: "fas fa-microchip", url: "pecas.html" },
      { name: "Nova Compra", icon: "fas fa-shopping-bag", url: "compras.html" },
      { name: "Cadastrar Fornecedor", icon: "fas fa-truck", url: "fornecedores.html" },
      { name: "Ver Alertas", icon: "fas fa-bell", url: "alertas.html" },
    ],
  },
}

const PermissionManager = {
  /**
   * o usuário tem acesso a uma página específica
   * @param {string} userType  
   * @param {string} pageUrl 
   * @returns {boolean} 
   */
  hasPageAccess(userType, pageUrl) {
    if (!userType || !pageUrl) return false

    const userPermissions = PERMISSIONS[userType]
    if (!userPermissions) return false

    const normalizedPageUrl = pageUrl.replace(/^\/+/, "").split("?")[0]

    // Verifica se a página está no menu do usuário
    return userPermissions.menu.some((item) => {
      const normalizedItemUrl = item.url.replace(/^\/+/, "")
      return normalizedItemUrl === normalizedPageUrl
    })
  },

  /**
   * permissões para tipo de usuário
   * @param {string} userType 
   * @returns {Array} 
   */
  getMenuPermissions(userType) {
    const userPermissions = PERMISSIONS[userType]
    return userPermissions ? userPermissions.menu : []
  },

  /**
   * 
   * @param {string} userType 
   * @returns {Array} 
   */
  getQuickActions(userType) {
    const userPermissions = PERMISSIONS[userType]
    return userPermissions ? userPermissions.quickActions : []
  },

  /**
   * Verifica se é somente leitura
   * @param {string} userType 
   * @param {string} pageUrl 
   * @returns {boolean} 
   */
  isReadOnly(userType, pageUrl) {
    const userPermissions = PERMISSIONS[userType]
    if (!userPermissions) return false

    const normalizedPageUrl = pageUrl.replace(/^\/+/, "").split("?")[0]
    const menuItem = userPermissions.menu.find((item) => {
      const normalizedItemUrl = item.url.replace(/^\/+/, "")
      return normalizedItemUrl === normalizedPageUrl
    })

    return menuItem ? !!menuItem.readonly : false
  },

  /**
   * menu baseado nas permissões do usuário
   * @param {string} userType 
   * @param {string} currentPage 
   */
  buildMenu(userType, currentPage = "") {
    const sidebar = document.getElementById("sidebar-menu")
    if (!sidebar) return

    const userPermissions = PERMISSIONS[userType]
    if (!userPermissions) return

    sidebar.innerHTML = ""

    const normalizedCurrentPage = currentPage.replace(/^\/+/, "").split("?")[0]

    userPermissions.menu.forEach((item) => {
      const link = document.createElement("a")
      link.href = item.url

      let content = `<i class="${item.icon}"></i> ${item.name}`

      if (item.readonly) {
        content +=
          ' <i class="fas fa-eye" style="margin-left: auto; font-size: 12px; opacity: 0.7;" title="Apenas visualização"></i>'
        link.classList.add("readonly")
      }

      link.innerHTML = content

      const normalizedItemUrl = item.url.replace(/^\/+/, "")
      if (normalizedItemUrl === normalizedCurrentPage) {
        link.classList.add("active")
      }

      sidebar.appendChild(link)
    })
  },

  /**
   * alerta de acesso negado
   * @param {string} pageName -
   */
  showAccessDeniedAlert(pageName = "esta página") {
    const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Acesso Negado!</strong><br>
                Você não tem permissão para acessar ${pageName}. Entre em contato com o administrador se precisar de acesso.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `

    // Remove alertas anteriores
    const existingAlerts = document.querySelectorAll('.alert[role="alert"]')
    existingAlerts.forEach((alert) => alert.remove())

    // Adiciona o novo alerta
    document.body.insertAdjacentHTML("afterbegin", alertHtml)

    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      const alert = document.querySelector('.alert[role="alert"]')
      if (alert) {
        alert.remove()
      }
    }, 5000)
  },

  /**
   * Verifica o acesso 
   */
  checkCurrentPageAccess() {
    const auth = window.auth
    const user = auth.user
    if (!user || !user.tipo_usuario) {
      console.error("Usuário não encontrado ou sem tipo definido")
      auth.logout()
      return
    }

    const currentPath = window.location.pathname
    let currentPage = currentPath.split("/").pop() || "index.html"

   

    // Verifica se tem acesso
    if (!this.hasPageAccess(user.tipo_usuario, currentPage)) {
      console.warn(`Acesso negado para ${user.tipo_usuario} na página ${currentPage}`)

      this.showAccessDeniedAlert(currentPage)

      setTimeout(() => {
        window.location.href = "index.html"
      }, 2000)

      return false
    }

    return true
  },

  /**
   * verifica acesso a uma página específica 
   * @param {string} pageUrl 
   */
  checkPageAccess(pageUrl) {
    const auth = window.auth
    if (!auth || !auth.user) {
      console.error("Usuário não autenticado")
      window.location.href = "login.html"
      return false
    }

    const user = auth.user
    if (!user.tipo_usuario) {
      console.error("Tipo de usuário não definido")
      auth.logout()
      return false
    }

    const normalizedPageUrl = pageUrl.replace("View/", "").replace(/^\/+/, "").split("?")[0]

    if (!this.hasPageAccess(user.tipo_usuario, normalizedPageUrl)) {
      console.warn(`Acesso negado para ${user.tipo_usuario} na página ${normalizedPageUrl}`)
      this.showAccessDeniedAlert(normalizedPageUrl)

      setTimeout(() => {
        window.location.href = "index.html"
      }, 2000)

      return false
    }

    return true
  },
}

window.PERMISSIONS = PERMISSIONS
window.PermissionManager = PermissionManager
