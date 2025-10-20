class MarcaManager {
  constructor() {
    this.marcas = []
    this.currentEditingId = null
    this.init()
  }

  async init() {
    console.log("🔄 Inicializando gerenciador de marcas")
    await this.loadMarcas()
    this.setupEventListeners()
  }

  setupEventListeners() {
    console.log("🔧 Configurando event listeners")

    // Event listener para busca
    const searchInput = document.getElementById("searchMarca")
    if (searchInput) {
      searchInput.removeEventListener("input", this.handleSearch)
      searchInput.addEventListener("input", () => this.handleSearch())
      console.log("✅ Event listener de busca configurado")
    }

    // Event listeners para modais
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("marcaModal")) {
        this.closeMarcaModal()
      }
    })

    this.setupFormValidation()
  }

  setupFormValidation() {
    const form = document.getElementById("marcaForm")
    if (!form) return

    // Real-time validation for nome field
    const nomeField = document.getElementById("marcaNome")
    if (nomeField) {
      nomeField.addEventListener("input", () => this.validateField("nome"))
      nomeField.addEventListener("blur", () => this.validateField("nome"))
    }

    // Real-time validation for descricao field
    const descricaoField = document.getElementById("marcaDescricao")
    if (descricaoField) {
      descricaoField.addEventListener("input", () => this.validateField("descricao"))
      descricaoField.addEventListener("blur", () => this.validateField("descricao"))
    }

    // Real-time validation for status field
    const statusField = document.getElementById("marcaStatus")
    if (statusField) {
      statusField.addEventListener("change", () => this.validateField("status"))
    }
  }

  validateField(fieldName) {
    const field = document.getElementById(`marca${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`)
    if (!field) return true

    const formGroup = field.closest(".form-group")
    const value = field.value.trim()
    let isValid = true
    let errorMessage = ""

    // Remove existing error messages
    const existingError = formGroup.querySelector(".error-message")
    if (existingError) {
      existingError.remove()
    }

    // Remove validation classes
    formGroup.classList.remove("has-error", "has-success")

    switch (fieldName) {
      case "nome":
        if (!value) {
          isValid = false
          errorMessage = "Nome da marca é obrigatório"
        } else if (value.length > 100) {
          isValid = false
          errorMessage = "Nome deve ter no máximo 100 caracteres"
        }
        break

      case "descricao":
        if (value && value.length > 255) {
          isValid = false
          errorMessage = "Descrição deve ter no máximo 255 caracteres"
        }
        break

      case "status":
        if (!value) {
          isValid = false
          errorMessage = "Status é obrigatório"
        }
        break
    }

    // Apply validation styling
    if (!isValid) {
      formGroup.classList.add("has-error")
      const errorDiv = document.createElement("div")
      errorDiv.className = "error-message"
      errorDiv.textContent = errorMessage
      formGroup.appendChild(errorDiv)
    } else if (value || fieldName === "status") {
      formGroup.classList.add("has-success")
    }

    return isValid
  }

  validateForm() {
    const fields = ["nome", "status"]
    let isValid = true

    fields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false
      }
    })

    // Also validate descricao if it has content
    const descricao = document.getElementById("marcaDescricao").value.trim()
    if (descricao) {
      if (!this.validateField("descricao")) {
        isValid = false
      }
    }

    return isValid
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("❌ Token não encontrado")
      window.location.href = "login.html"
      return null
    }

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }

    const finalOptions = { ...defaultOptions, ...options }
    if (options.body && typeof options.body === "object") {
      finalOptions.body = JSON.stringify(options.body)
    }

    try {
      console.log("📡 Fazendo requisição:", url, finalOptions.method || "GET")

      const response = await fetch(`http://localhost:3000${url}`, finalOptions)

      console.log("📡 Status da resposta:", response.status)

      if (response.status === 401) {
        console.error("❌ Token expirado, redirecionando para login")
        localStorage.removeItem("token")
        window.location.href = "login.html"
        return null
      }

      return response
    } catch (error) {
      console.error("❌ Erro na requisição:", error)
      this.showToast("Erro de conexão com o servidor", "error")
      return null
    }
  }

  async loadMarcas() {
    try {
      this.showLoading(true)
      console.log("🔄 Carregando marcas...")

      const response = await this.makeAuthenticatedRequest("/api/marcas")
      if (!response || !response.ok) {
        throw new Error("Erro ao carregar marcas")
      }

      const result = await response.json()
      if (result.success) {
        this.marcas = result.data || []
        console.log("✅ Marcas carregadas:", this.marcas.length)
        this.renderMarcas(this.marcas)
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error("❌ Erro ao carregar marcas:", error)
      this.showToast("Erro ao carregar marcas", "error")
      this.renderMarcas([])
    } finally {
      this.showLoading(false)
    }
  }

  renderMarcas(marcas) {
    const tbody = document.getElementById("marcasTableBody")
    if (!tbody) {
      console.error("❌ Elemento marcasTableBody não encontrado")
      return
    }

    if (marcas.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Nenhuma marca encontrada</h5>
                            <p class="text-muted">Clique em "Nova Marca" para adicionar a primeira marca.</p>
                        </div>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = marcas
      .map((marca) => {
        const statusClass = marca.status ? "" : "inativo"
        const statusText = marca.status ? "Ativo" : "Inativo"
        const statusBadgeClass = marca.status ? "status-ativo" : "status-inativo"

        return `
                <tr class="marca-row ${statusClass}" data-id="${marca.marca_id || marca.id}">
                    <td>${marca.marca_id || marca.id}</td>
                    <td class="nome-cell">${this.escapeHtml(marca.nome)}</td>
                    <td class="descricao-cell">${this.escapeHtml(marca.descricao || "-")}</td>
                    <td>
                        <span class="status-badge ${statusBadgeClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="actions-column">
                        <div class="action-buttons">
                            <button class="btn-edit"
                                    onclick="marcaManager.editMarca(${marca.marca_id || marca.id})"
                                    title="Editar marca">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn-toggle-status"
                                    onclick="confirmAction('${marca.status ? "desativar" : "ativar"}', 'marca', function() { marcaManager.performToggleStatus(${marca.marca_id || marca.id}, ${!marca.status}); })"
                                    title="${marca.status ? "Desativar" : "Ativar"} marca">
                                <i class="fas ${marca.status ? "fa-eye-slash" : "fa-eye"}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")

    console.log("✅ Tabela renderizada com", marcas.length, "marcas")
  }

  async performToggleStatus(id, newStatus) {
    try {
      this.showLoading(true)
      console.log("🔄 Alterando status da marca ID:", id, "para:", newStatus)

      const response = await this.makeAuthenticatedRequest(`/api/marcas/${id}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || `Erro ${response.status}`)
      }

      const result = await response.json()
      console.log("✅ Status alterado com sucesso:", result)

      const statusText = newStatus ? "ativada" : "inativada"
      this.showToast(`Marca ${statusText} com sucesso!`, "success")

      setTimeout(async () => {
        await this.loadMarcas()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao alterar status:", error)
      this.showToast(error.message || "Erro ao alterar status da marca", "error")
    } finally {
      this.showLoading(false)
    }
  }

  showAddMarcaModal() {
    console.log("📝 Abrindo modal para nova marca")
    this.currentEditingId = null
    document.getElementById("marcaModalTitle").textContent = "Nova Marca"
    document.getElementById("marcaForm").reset()
    document.getElementById("marcaId").value = ""

    this.clearValidationStates()

    document.getElementById("marcaModal").style.display = "block"

    setTimeout(() => {
      document.getElementById("marcaNome").focus()
    }, 100)
  }

  async editMarca(id) {
    console.log("📝 Editando marca ID:", id)
    const marca = this.marcas.find((m) => (m.marca_id || m.id) === id)
    if (!marca) {
      this.showToast("Marca não encontrada", "error")
      return
    }

    this.currentEditingId = id
    document.getElementById("marcaModalTitle").textContent = "Editar Marca"
    document.getElementById("marcaId").value = id
    document.getElementById("marcaNome").value = marca.nome || ""
    document.getElementById("marcaDescricao").value = marca.descricao || ""
    document.getElementById("marcaStatus").value = marca.status ? "1" : "0"

    this.clearValidationStates()

    document.getElementById("marcaModal").style.display = "block"
  }

  clearValidationStates() {
    const formGroups = document.querySelectorAll("#marcaForm .form-group")
    formGroups.forEach((group) => {
      group.classList.remove("has-error", "has-success")
      const errorMessage = group.querySelector(".error-message")
      if (errorMessage) {
        errorMessage.remove()
      }
    })
  }

  closeMarcaModal() {
    console.log("📝 Fechando modal de marca")
    document.getElementById("marcaModal").style.display = "none"
    document.getElementById("marcaForm").reset()
    this.clearValidationStates()
    this.currentEditingId = null
  }

  async handleFormSubmit(event) {
    console.log("📝 handleFormSubmit chamada")
    event.preventDefault()

    if (!this.validateForm()) {
      this.showToast("Por favor, corrija os erros no formulário", "error")
      return false
    }

    const formData = new FormData(event.target)

    const marcaData = {
      nome: formData.get("nome") || "",
      descricao: formData.get("descricao")?.trim() || null,
      status: Number.parseInt(formData.get("status")),
    }

    console.log("📝 Dados processados:", marcaData)

    try {
      this.setFormLoading(true)

      const isEdit = this.currentEditingId !== null
      const url = isEdit ? `/api/marcas/${this.currentEditingId}` : "/api/marcas"
      const method = isEdit ? "PUT" : "POST"

      console.log(`🔄 ${isEdit ? "Atualizando" : "Criando"} marca:`, marcaData)

      const response = await this.makeAuthenticatedRequest(url, {
        method: method,
        body: marcaData,
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        console.error("❌ Resposta da API:", errorData)
        throw new Error(errorData.error || "Erro ao salvar marca")
      }

      const result = await response.json()
      console.log("✅ Marca salva com sucesso:", result)

      this.showToast(result.message || `Marca ${isEdit ? "atualizada" : "criada"} com sucesso!`, "success")
      this.closeMarcaModal()

      setTimeout(async () => {
        await this.loadMarcas()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao salvar marca:", error)
      this.showToast(error.message || "Erro ao salvar marca", "error")
    } finally {
      this.setFormLoading(false)
    }

    return false
  }

  setFormLoading(loading) {
    const form = document.getElementById("marcaForm")
    const submitBtn = form.querySelector('button[type="submit"]')
    const cancelBtn = form.querySelector(".btn-secondary")
    const inputs = form.querySelectorAll("input, select, textarea")

    if (loading) {
      submitBtn.disabled = true
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'
      cancelBtn.disabled = true
      inputs.forEach((input) => (input.disabled = true))
    } else {
      submitBtn.disabled = false
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar'
      cancelBtn.disabled = false
      inputs.forEach((input) => (input.disabled = false))
    }
  }

  handleSearch() {
    const searchTerm = document.getElementById("searchMarca").value.toLowerCase().trim()
    console.log("🔍 Buscando por:", searchTerm)

    if (!searchTerm) {
      console.log("🔍 Busca vazia, mostrando todas as marcas")
      this.renderMarcas(this.marcas)
      return
    }

    const filtered = this.marcas.filter((marca) => {
      const matches =
        marca.nome.toLowerCase().includes(searchTerm) ||
        (marca.descricao && marca.descricao.toLowerCase().includes(searchTerm))

      if (matches) {
        console.log("🎯 Match encontrado:", marca.nome)
      }
      return matches
    })

    console.log(`🔍 Busca por "${searchTerm}" encontrou ${filtered.length} marcas`)
    this.renderMarcas(filtered)
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text || ""
    return div.innerHTML
  }

  showLoading(show) {
    console.log(show ? "⏳ Carregando..." : "✅ Carregamento concluído")
  }

  showToast(message, type = "info") {
    console.log(`${type.toUpperCase()}: ${message}`)

    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`

    const icon = type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"

    toast.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#17a2b8"};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
    `

    // Add animation styles
    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = "slideInRight 0.3s ease-out reverse"
      setTimeout(() => {
        toast.remove()
        style.remove()
      }, 300)
    }, 3000)
  }
}

// Funções globais para compatibilidade com HTML
let marcaManager

function showAddMarcaModal() {
  console.log("🌐 showAddMarcaModal chamada")
  marcaManager.showAddMarcaModal()
}

function closeMarcaModal() {
  console.log("🌐 closeMarcaModal chamada")
  marcaManager.closeMarcaModal()
}

function saveMarcaForm(event) {
  console.log("🌐 saveMarcaForm chamada - prevenindo submit padrão")
  event.preventDefault()
  return marcaManager.handleFormSubmit(event)
}

function searchMarcas() {
  console.log("🌐 searchMarcas chamada")
  marcaManager.handleSearch()
}

function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} esta ${item}?`
  if (confirm(message)) {
    callback()
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Inicializando MarcaManager")
  marcaManager = new MarcaManager()
})
