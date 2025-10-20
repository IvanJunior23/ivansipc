class PagePermissionManager {
  constructor() {
    this.initialized = false
    this.currentPage = window.location.pathname.split("/").pop() || "index.html"
    this.user = null
    this.hasAccess = false
    this.isReadOnly = false
  }

  async init() {
    if (this.initialized) return

    console.log("Inicializando PagePermissionManager...")

    // Aguarda os sistemas necessários
    await this.waitForDependencies()

    // Verifica autenticação
    const auth = window.auth // Declare the auth variable
    if (!auth.isAuthenticated()) {
      this.redirectToLogin()
      return
    }

    this.user = auth.user
    if (!this.user || !this.user.tipo_usuario) {
      console.error("Dados do usuário inválidos")
      this.showAccessDenied()
      return
    }

    // Verifica permissões
    const PermissionManager = window.PermissionManager // Declare the PermissionManager variable
    this.checkPermissions()
    this.initialized = true

    console.log("PagePermissionManager inicializado com sucesso")
  }

  async waitForDependencies() {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (
          typeof window.auth !== "undefined" &&
          typeof window.PermissionManager !== "undefined" &&
          window.auth.initialized
        ) {
          resolve()
        } else {
          setTimeout(checkDependencies, 100)
        }
      }
      checkDependencies()
    })
  }

  checkPermissions() {
    console.log(`Verificando permissões para ${this.user.tipo_usuario} na página ${this.currentPage}`)

    // Verifica acesso à página
    this.hasAccess = window.PermissionManager.hasPageAccess(this.user.tipo_usuario, this.currentPage)

    if (!this.hasAccess) {
      console.warn(`Acesso negado para ${this.user.tipo_usuario} na página ${this.currentPage}`)
      this.showAccessDenied()
      return
    }

    // Verifica se é somente leitura
    this.isReadOnly = window.PermissionManager.isReadOnly(this.user.tipo_usuario, this.currentPage)

    if (this.isReadOnly) {
      console.log("Página em modo somente leitura")
      this.enableReadOnlyMode()
    }

    // Intercepta navegação
    this.interceptNavigation()

    console.log("Permissões verificadas:", { hasAccess: this.hasAccess, isReadOnly: this.isReadOnly })
  }

  showAccessDenied() {
    // Remove conteúdo da página
    const mainContent = document.querySelector("main, .main-content, .container, body > div")
    if (mainContent) {
      mainContent.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="min-height: 100vh;">
                    <div class="text-center">
                        <div class="mb-4">
                            <i class="fas fa-shield-alt text-danger" style="font-size: 4rem;"></i>
                        </div>
                        <h2 class="text-danger mb-3">Acesso Negado</h2>
                        <p class="text-muted mb-4">
                            Você não tem permissão para acessar esta página.<br>
                            Entre em contato com o administrador se precisar de acesso.
                        </p>
                        <button class="btn btn-primary" onclick="window.location.href='index.html'">
                            <i class="fas fa-home me-2"></i>Voltar ao Dashboard
                        </button>
                    </div>
                </div>
            `
    }

    // Mostra alerta
    window.PermissionManager.showAccessDeniedAlert(this.currentPage)
  }

  enableReadOnlyMode() {
    // Adiciona banner de somente leitura
    const banner = document.createElement("div")
    banner.className = "alert alert-warning d-flex align-items-center mb-3"
    banner.innerHTML = `
            <i class="fas fa-eye me-2"></i>
            <strong>Modo Somente Leitura:</strong> Você pode visualizar as informações, mas não pode fazer alterações.
        `

    const container = document.querySelector(".container, .main-content, main")
    if (container) {
      container.insertBefore(banner, container.firstChild)
    }

    // Desabilita elementos de formulário
    this.disableFormElements()

    // Desabilita botões de ação
    this.disableActionButtons()
  }

  disableFormElements() {
    const formElements = document.querySelectorAll('input, select, textarea, button[type="submit"]')
    formElements.forEach((element) => {
      element.disabled = true
      element.classList.add("readonly-element")
      element.title = "Você tem acesso somente leitura a esta página"
    })

    // Adiciona estilos CSS para elementos readonly
    const style = document.createElement("style")
    style.textContent = `
            .readonly-element {
                opacity: 0.6 !important;
                cursor: not-allowed !important;
                background-color: #f8f9fa !important;
            }
        `
    document.head.appendChild(style)
  }

  disableActionButtons() {
    const actionSelectors = [
      'a[href*="edit"]',
      'a[href*="delete"]',
      'a[href*="add"]',
      'a[href*="create"]',
      'button[onclick*="edit"]',
      'button[onclick*="delete"]',
      'button[onclick*="add"]',
      'button[onclick*="create"]',
      ".btn-danger",
      '.btn-success:not([href*="view"])',
      '.btn-primary:not([href*="view"])',
    ]

    actionSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach((element) => {
        element.style.opacity = "0.5"
        element.style.pointerEvents = "none"
        element.title = "Ação não permitida em modo somente leitura"
        element.classList.add("disabled")
      })
    })
  }

  interceptNavigation() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]")
      if (!link) return

      const href = link.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.includes("://")) {
        return
      }

      const targetPage = href.replace(/^\/+/, "")

      if (!window.PermissionManager.hasPageAccess(this.user.tipo_usuario, targetPage)) {
        e.preventDefault()
        window.PermissionManager.showAccessDeniedAlert(targetPage)
        return false
      }
    })
  }

  redirectToLogin() {
    console.log("Redirecionando para login...")
    window.location.href = "login.html"
  }

  // Métodos públicos para verificação de permissões
  canPerformAction(action) {
    if (!this.hasAccess) return false
    if (!this.isReadOnly) return true

    const readOnlyActions = ["create", "edit", "delete", "update", "save", "add", "remove"]
    return !readOnlyActions.includes(action.toLowerCase())
  }

  showPermissionError(message) {
    window.PermissionManager.showAccessDeniedAlert(message || "Você não tem permissão para realizar esta ação")
  }
}

// Inicializa automaticamente
const pagePermissionManager = new PagePermissionManager()

document.addEventListener("DOMContentLoaded", () => {
  pagePermissionManager.init()
})

// Exporta para uso global
window.pagePermissionManager = pagePermissionManager
