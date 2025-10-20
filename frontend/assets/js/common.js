document.addEventListener("DOMContentLoaded", () => {
  // Properly declare auth variable from window object
  const auth = window.auth
  if (typeof auth === "undefined") {
    console.error("auth.js precisa ser carregado antes de common.js")
    return
  }

  // --- PONTO CRÍTICO PARA O FLUXO DE LOGIN ---
  // Verifica a autenticação em todas as páginas que incluem este script
  if (!auth.isAuthenticated()) {
    // Se não estiver autenticado, volta para a tela de login
    window.location.href = "login.html"
    return // Para a execução do script para evitar erros
  }

  // Properly declare PermissionManager variable from window object
  const PermissionManager = window.PermissionManager
  if (typeof PermissionManager !== "undefined") {
    // Aguarda um pouco para garantir que o PermissionManager foi carregado
    setTimeout(() => {
      if (!PermissionManager.checkCurrentPageAccess()) {
        return // Se não tem acesso, para a execução
      }

      // Se a verificação passar, continua para construir o menu lateral
      buildSidebar()
    }, 100)
  } else {
    console.warn("PermissionManager não encontrado, construindo sidebar sem verificação de permissões")
    buildSidebar()
  }
})

async function buildSidebar() {
  // Properly declare auth variable from window object
  const auth = window.auth
  const user = await auth.getCurrentUser()
  if (!user) {
    console.error("Usuário não encontrado")
    auth.logout()
    return
  }

  const sidebarMenu = document.getElementById("sidebar-menu")
  if (!sidebarMenu) {
    console.warn("Elemento sidebar-menu não encontrado")
    return
  }

  let menuItems = []

  // Properly declare PermissionManager variable from window object
  const PermissionManager = window.PermissionManager
  if (typeof PermissionManager !== "undefined" && user.tipo_usuario) {
    // Usa o sistema de permissões
    menuItems = PermissionManager.getMenuPermissions(user.tipo_usuario)
    console.log(`Carregando menu para usuário tipo: ${user.tipo_usuario}`, menuItems)
  } else {
    // Fallback para menu básico se não houver sistema de permissões
    console.warn("Sistema de permissões não disponível, usando menu básico")
    menuItems = [{ name: "Dashboard", icon: "fas fa-home", url: "index.html", active: true }]
  }

  // Limpa o menu atual
  sidebarMenu.innerHTML = ""

  // Constrói os itens do menu
  menuItems.forEach((item) => {
    const li = document.createElement("li")
    li.className = "nav-item"

    const isCurrentPage =
      window.location.pathname.endsWith(item.url) ||
      (item.url === "index.html" &&
        (window.location.pathname === "/" || window.location.pathname.endsWith("index.html")))

    const activeClass = isCurrentPage ? "active" : ""
    const readonlyIndicator = item.readonly ? '<small class="text-muted">(Consulta)</small>' : ""

    li.innerHTML = `
            <a class="nav-link ${activeClass}" href="${item.url}">
                <i class="${item.icon}"></i>
                <span>${item.name} ${readonlyIndicator}</span>
            </a>
        `

    sidebarMenu.appendChild(li)
  })

  buildQuickActions(user.tipo_usuario)

  updateUserInfo(user)
}

function buildQuickActions(userType) {
  const quickActionsContainer = document.getElementById("quick-actions")
  if (!quickActionsContainer) {
    return
  }

  let quickActions = []

  // Properly declare PermissionManager variable from window object
  const PermissionManager = window.PermissionManager
  if (typeof PermissionManager !== "undefined" && userType) {
    quickActions = PermissionManager.getQuickActions(userType)
  }

  // Limpa as ações atuais
  quickActionsContainer.innerHTML = ""

  if (quickActions.length === 0) {
    quickActionsContainer.style.display = "none"
    return
  }

  quickActionsContainer.style.display = "block"

  // Adiciona título
  const title = document.createElement("h6")
  title.className = "sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted"
  title.innerHTML = "<span>Ações Rápidas</span>"
  quickActionsContainer.appendChild(title)

  // Adiciona as ações
  const ul = document.createElement("ul")
  ul.className = "nav flex-column mb-2"

  quickActions.forEach((action) => {
    const li = document.createElement("li")
    li.className = "nav-item"

    li.innerHTML = `
            <a class="nav-link" href="${action.url}">
                <i class="${action.icon}"></i>
                <span>${action.name}</span>
            </a>
        `

    ul.appendChild(li)
  })

  quickActionsContainer.appendChild(ul)
}

function updateUserInfo(user) {
  // Atualiza nome do usuário
  const userNameElements = document.querySelectorAll(".user-name, #user-name")
  userNameElements.forEach((element) => {
    if (user.nome) {
      element.textContent = user.nome
    } else if (user.email) {
      element.textContent = user.email.split("@")[0]
    }
  })

  // Atualiza tipo de usuário
  const userTypeElements = document.querySelectorAll(".user-type, #user-type")
  userTypeElements.forEach((element) => {
    if (user.tipo_usuario) {
      const tipoFormatado = user.tipo_usuario.charAt(0).toUpperCase() + user.tipo_usuario.slice(1)
      element.textContent = tipoFormatado
    }
  })

  // Atualiza email do usuário
  const userEmailElements = document.querySelectorAll(".user-email, #user-email")
  userEmailElements.forEach((element) => {
    if (user.email) {
      element.textContent = user.email
    }
  })
}

function checkPagePermission(pageUrl) {
  // Properly declare auth variable from window object
  const auth = window.auth
  if (!auth.isAuthenticated()) {
    return false
  }

  const user = auth.user
  if (!user || !user.tipo_usuario) {
    return false
  }

  // Properly declare PermissionManager variable from window object
  const PermissionManager = window.PermissionManager
  if (typeof PermissionManager !== "undefined") {
    return PermissionManager.hasPageAccess(user.tipo_usuario, pageUrl)
  }

  return false
}

function interceptNavigation() {
  // Intercepta cliques em links
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]")
    if (!link) return

    const href = link.getAttribute("href")
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.includes("://")) {
      return // Ignora links especiais ou externos
    }

    const pageUrl = href.replace(/^\/+/, "")

    if (!checkPagePermission(pageUrl)) {
      e.preventDefault()

      // Properly declare PermissionManager variable from window object
      const PermissionManager = window.PermissionManager
      if (typeof PermissionManager !== "undefined") {
        PermissionManager.showAccessDeniedAlert(pageUrl)
      } else {
        alert("Você não tem permissão para acessar esta página.")
      }

      return false
    }
  })
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(interceptNavigation, 200)
})

// Exporta funções para uso global
window.buildSidebar = buildSidebar
window.checkPagePermission = checkPagePermission
