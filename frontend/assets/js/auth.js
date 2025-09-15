const auth = {
  user: null,
  token: null,
  initialized: false,

  init() {
    if (this.initialized) return
    this.initialized = true

    this.loadStoredAuth()

    if (this.isAuthenticated() && window.location.pathname.endsWith("login.html")) {
      window.location.href = "/index.html"
    }

    this.setupEventListeners()
    },
      loadStoredAuth() {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
         try {
        // Validate token format before using it
        if (this.isValidJWTFormat(token)) {
          this.token = token.trim() // Remove any whitespace
          this.user = JSON.parse(userData)
        } else {
          console.warn("Token inválido encontrado no localStorage, limpando...")
          this.clearAuth()
        }
        } catch (error) {
           console.error("Erro ao carregar dados do localStorage:", error)
        this.clearAuth()
             }
    }
      },

  isValidJWTFormat(token) {
    if (!token || typeof token !== "string") return false

    // JWT should have 3 parts separated by dots
    const parts = token.trim().split(".")
    if (parts.length !== 3) return false

    // Each part should be base64 encoded (basic check)
    try {
      parts.forEach((part) => {
        if (!part || part.length === 0) throw new Error("Empty part")
        // Try to decode base64 (will throw if invalid)
        atob(part.replace(/-/g, "+").replace(/_/g, "/"))
      })
      return true
    } catch (error) {
      return false
       }
  },

  isAuthenticated() {
    return !!(this.token && this.user && this.isValidJWTFormat(this.token))
  },

  clearAuth() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    this.token = null
    this.user = null
  },

  async login(email, senha) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      const data = await response.json()

      if (data.success) {
        if (this.isValidJWTFormat(data.token)) {
          const cleanToken = data.token.trim()
          localStorage.setItem("token", cleanToken)
          localStorage.setItem("user", JSON.stringify(data.user))
          this.token = cleanToken
          this.user = data.user

          window.location.href = "/index.html"
          return { success: true }
        } else {
          console.error("Token recebido do servidor é inválido:", data.token)
          return { success: false, message: "Token inválido recebido do servidor" }
        }
      } else {
        return { success: false, message: data.message || "Erro no login" }
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
      return { success: false, message: "Erro de conexão. Verifique se o servidor está rodando." }
    }
  },

  logout() {
    this.clearAuth()
    window.location.href = "/login.html"
  },

  getCurrentUser() {
    return Promise.resolve(this.user)
  },

  async authenticatedRequest(url, options = {}) {
    const token = this.token || localStorage.getItem("token")

    if (!token) {
      console.error("Token não encontrado para requisição autenticada.")
      this.logout()
      return Promise.reject(new Error("Token não encontrado"))
    }

    if (!this.isValidJWTFormat(token)) {
      console.error("Token malformado detectado, fazendo logout...")
      this.logout()
      return Promise.reject(new Error("Token malformado"))
    }

    const cleanToken = token.trim()
    console.log("[DEBUG] Enviando token:", cleanToken.substring(0, 20) + "...")

    const defaultHeaders = {
      Authorization: `Bearer ${cleanToken}`,
      "Content-Type": "application/json",
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
         },
         }

    try {
      const response = await fetch(url, config)

      if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}))
        if (data.error && (data.error.includes("Token") || data.error.includes("inválido"))) {
          console.warn("Token expirado ou inválido, fazendo logout...")
          this.logout()
          return Promise.reject(new Error("Token expirado"))
        }
      }

      return response
    } catch (error) {
      console.error("Erro na requisição autenticada:", error)
      throw error
    }
  },

  async makeAuthenticatedRequest(url, options = {}) {
    return this.authenticatedRequest(url, options)
  },

  setupEventListeners() {
    const loginForm = document.getElementById("loginForm")
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const email = document.getElementById("email").value.trim()
        const senha = document.getElementById("senha").value
        const submitBtn = loginForm.querySelector('button[type="submit"]')

        if (!email || !senha) {
          this.showError("Por favor, preencha todos os campos.")
          return
        }

        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'

        const result = await this.login(email, senha)

        if (!result.success) {
          this.showError(result.message)
          submitBtn.disabled = false
          submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar'
        }
      })
    }
  },

  showError(message) {
    const errorDiv = document.getElementById("error-message")
    if (errorDiv) {
      errorDiv.textContent = message
      errorDiv.style.display = "block"
    } else {
      alert(message)
    }
  },
}

document.addEventListener("DOMContentLoaded", () => {
  auth.init()
})

window.auth = auth