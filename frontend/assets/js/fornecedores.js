class FornecedorManager {
  constructor() {
    this.fornecedores = []
    this.currentEditingId = null
    this.init()
  }

  async init() {
    console.log(" 🔄 Inicializando gerenciador de fornecedores")
    await this.loadFornecedores()
    this.setupEventListeners()
  }

  setupEventListeners() {
    console.log(" 🔧 Configurando event listeners")

    const searchInput = document.getElementById("searchFornecedor")
    if (searchInput) {
      searchInput.removeEventListener("input", this.handleSearch)
      searchInput.addEventListener("input", () => this.handleSearch())
    }

    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("fornecedorModal")) {
        this.closeFornecedorModal()
      }
      if (e.target === document.getElementById("viewFornecedorModal")) {
        this.closeViewFornecedorModal()
      }
    })
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error(" ❌ Token não encontrado")
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
      const response = await fetch(`http://localhost:3000${url}`, finalOptions)

      if (response.status === 401) {
        console.error(" ❌ Token expirado, redirecionando para login")
        localStorage.removeItem("token")
        window.location.href = "login.html"
        return null
      }

      return response
    } catch (error) {
      console.error(" ❌ Erro na requisição:", error)
      this.showToast("Erro de conexão com o servidor", "error")
      return null
    }
  }

  async loadFornecedores() {
    try {
      this.showLoading(true)
      console.log(" 🔄 Carregando fornecedores da API...")

      const response = await this.makeAuthenticatedRequest("/api/fornecedores?incluir_inativos=true")
      if (!response || !response.ok) {
        throw new Error("Erro ao carregar fornecedores")
      }

      const result = await response.json()
      console.log(" 📦 Resposta da API de fornecedores:", result)

      if (result.success) {
        this.fornecedores = result.data || []
        console.log(" ✅ Fornecedores carregados:", this.fornecedores.length)
        this.renderFornecedores(this.fornecedores)
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error(" ❌ Erro ao carregar fornecedores:", error)
      this.showToast("Erro ao carregar fornecedores", "error")
      this.renderFornecedores([])
    } finally {
      this.showLoading(false)
    }
  }

  renderFornecedores(fornecedores) {
    const tbody = document.getElementById("fornecedoresTableBody")
    if (!tbody) {
      console.error(" ❌ Elemento fornecedoresTableBody não encontrado")
      return
    }

    console.log(" 🎨 Renderizando", fornecedores.length, "fornecedores")

    if (fornecedores.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px;">
            <div style="color: #6c757d;">
              <i class="fas fa-truck" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
              <h5>Nenhum fornecedor encontrado</h5>
              <p>Clique em "Novo Fornecedor" para adicionar o primeiro fornecedor.</p>
            </div>
          </td>
        </tr>
      `
      return
    }

    tbody.innerHTML = fornecedores
      .map((fornecedor) => {
        const statusClass = fornecedor.status ? "status-ativo" : "status-inativo"
        const statusText = fornecedor.status ? "Ativo" : "Inativo"

        return `
          <tr data-id="${fornecedor.fornecedor_id}">
            <td>${fornecedor.fornecedor_id}</td>
            <td><strong>${this.escapeHtml(fornecedor.nome || "-")}</strong></td>
            <td>${this.escapeHtml(fornecedor.cnpj || "-")}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="actions-column">
              <div class="action-buttons" style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-edit"
                        onclick="fornecedorManager.editFornecedor(${fornecedor.fornecedor_id})"
                        title="Editar fornecedor">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn-toggle-status ${fornecedor.status ? "btn-delete" : "btn-view"}"
                        onclick="confirmAction('${fornecedor.status ? "desativar" : "ativar"}', 'fornecedor', function() { fornecedorManager.performToggleStatus(${fornecedor.fornecedor_id}, ${!fornecedor.status}); })"
                        title="${fornecedor.status ? "Desativar" : "Ativar"} fornecedor">
                  <i class="fas ${fornecedor.status ? "fa-toggle-on" : "fa-toggle-off"}"></i>
                </button>
              </div>
            </td>
          </tr>
        `
      })
      .join("")

    console.log(" ✅ Tabela renderizada com", fornecedores.length, "fornecedores")
  }

  async performToggleStatus(id, newStatus) {
    try {
      this.showLoading(true)
      console.log(" 🔄 Alterando status do fornecedor ID:", id, "para:", newStatus)

      const response = await this.makeAuthenticatedRequest(`/api/fornecedores/${id}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || `Erro ${response.status}`)
      }

      const result = await response.json()
      console.log(" ✅ Status alterado com sucesso:", result)

      const statusText = newStatus ? "ativado" : "inativado"
      this.showToast(`Fornecedor ${statusText} com sucesso!`, "success")

      setTimeout(async () => {
        await this.loadFornecedores()
      }, 500)
    } catch (error) {
      console.error(" ❌ Erro ao alterar status:", error)
      this.showToast(error.message || "Erro ao alterar status do fornecedor", "error")
    } finally {
      this.showLoading(false)
    }
  }

  showAddFornecedorModal() {
    console.log(" 📝 Abrindo modal para novo fornecedor")
    this.currentEditingId = null
    document.getElementById("fornecedorModalTitle").textContent = "Novo Fornecedor"
    document.getElementById("fornecedorForm").reset()
    document.getElementById("fornecedorId").value = ""
    document.getElementById("fornecedorModal").style.display = "block"
  }

  async editFornecedor(id) {
    console.log(" 📝 Editando fornecedor ID:", id)
    const fornecedor = this.fornecedores.find((f) => f.fornecedor_id === id)
    if (!fornecedor) {
      this.showToast("Fornecedor não encontrado", "error")
      return
    }

    console.log(" 📋 Dados do fornecedor para edição:", fornecedor)

    this.currentEditingId = id
    document.getElementById("fornecedorModalTitle").textContent = "Editar Fornecedor"
    document.getElementById("fornecedorId").value = id

    // Preencher todos os campos
    document.getElementById("fornecedorNome").value = fornecedor.nome || ""
    document.getElementById("fornecedorCnpj").value = fornecedor.cnpj || ""
    document.getElementById("fornecedorTelefone").value = fornecedor.telefone || ""
    document.getElementById("fornecedorEmail").value = fornecedor.email || ""
    document.getElementById("fornecedorLogradouro").value = fornecedor.logradouro || ""
    document.getElementById("fornecedorNumero").value = fornecedor.numero || ""
    document.getElementById("fornecedorComplemento").value = fornecedor.complemento || ""
    document.getElementById("fornecedorBairro").value = fornecedor.bairro || ""
    document.getElementById("fornecedorCidade").value = fornecedor.cidade || ""
    document.getElementById("fornecedorEstado").value = fornecedor.estado || ""
    document.getElementById("fornecedorCep").value = fornecedor.cep || ""

    document.getElementById("fornecedorModal").style.display = "block"
  }

  closeFornecedorModal() {
    console.log(" 📝 Fechando modal de fornecedor")
    document.getElementById("fornecedorModal").style.display = "none"
    document.getElementById("fornecedorForm").reset()
    this.currentEditingId = null
  }

  closeViewFornecedorModal() {
    console.log(" 📝 Fechando modal de visualização")
    document.getElementById("viewFornecedorModal").style.display = "none"
  }

  async handleFormSubmit(event) {
    console.log(" 📝 handleFormSubmit chamada")
    event.preventDefault()

    const submitBtn = event.target.querySelector('button[type="submit"]')
    if (submitBtn.disabled) {
      console.log(" ⚠️ Formulário já está sendo enviado, ignorando submit duplicado")
      return false
    }

    const formData = new FormData(event.target)

    const fornecedorData = {
      nome: formData.get("nome")?.trim(),
      cnpj: formData.get("cnpj")?.trim(),
      telefone: formData.get("telefone")?.trim(),
      email: formData.get("email")?.trim(),
      endereco: {
        logradouro: formData.get("logradouro")?.trim(),
        numero: formData.get("numero")?.trim(),
        complemento: formData.get("complemento")?.trim() || null,
        bairro: formData.get("bairro")?.trim(),
        cidade: formData.get("cidade")?.trim(),
        estado: formData.get("estado"),
        cep: formData.get("cep")?.trim(),
      },
    }

    console.log(" 🏠 Dados do endereço estruturados:", fornecedorData.endereco)

    // Validações básicas
    if (!fornecedorData.nome || !fornecedorData.cnpj || !fornecedorData.telefone || !fornecedorData.email) {
      this.showToast("Por favor, preencha todos os campos obrigatórios de dados da empresa e contato", "error")
      return false
    }

    if (
      !fornecedorData.endereco.logradouro ||
      !fornecedorData.endereco.numero ||
      !fornecedorData.endereco.bairro ||
      !fornecedorData.endereco.cidade ||
      !fornecedorData.endereco.estado ||
      !fornecedorData.endereco.cep
    ) {
      this.showToast("Por favor, preencha todos os campos obrigatórios de endereço", "error")
      return false
    }

    console.log(" 📝 Dados completos sendo enviados:", fornecedorData)

    try {
      this.setFormLoading(true)

      const isEdit = this.currentEditingId !== null
      const url = isEdit ? `/api/fornecedores/${this.currentEditingId}` : "/api/fornecedores"
      const method = isEdit ? "PUT" : "POST"

      console.log(` 🔄 ${isEdit ? "Atualizando" : "Criando"} fornecedor:`, fornecedorData)

      const response = await this.makeAuthenticatedRequest(url, {
        method: method,
        body: fornecedorData,
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        console.error(" ❌ Resposta da API:", errorData)
        throw new Error(errorData.message || errorData.error || "Erro ao salvar fornecedor")
      }

      const result = await response.json()
      console.log(" ✅ Fornecedor salvo com sucesso:", result)

      this.showToast(result.message || `Fornecedor ${isEdit ? "atualizado" : "criado"} com sucesso!`, "success")
      this.closeFornecedorModal()

      setTimeout(async () => {
        await this.loadFornecedores()
      }, 500)
    } catch (error) {
      console.error(" ❌ Erro ao salvar fornecedor:", error)
      this.showToast(error.message || "Erro ao salvar fornecedor", "error")
    } finally {
      this.setFormLoading(false)
    }

    return false
  }

  setFormLoading(loading) {
    const form = document.getElementById("fornecedorForm")
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
      submitBtn.innerHTML = "Salvar"
      cancelBtn.disabled = false
      inputs.forEach((input) => (input.disabled = false))
    }
  }

  handleSearch() {
    const searchTerm = document.getElementById("searchFornecedor").value.toLowerCase().trim()
    console.log(" 🔍 Buscando por:", searchTerm)

    if (!searchTerm) {
      this.renderFornecedores(this.fornecedores)
      return
    }

    const filtered = this.fornecedores.filter((fornecedor) => {
      return (
        (fornecedor.nome && fornecedor.nome.toLowerCase().includes(searchTerm)) ||
        (fornecedor.cnpj && fornecedor.cnpj.includes(searchTerm))
      )
    })

    console.log(` 🔍 Busca por "${searchTerm}" encontrou ${filtered.length} fornecedores`)
    this.renderFornecedores(filtered)
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text || ""
    return div.innerHTML
  }

  showLoading(show) {
    console.log(show ? " ⏳ Carregando..." : " ✅ Carregamento concluído")
  }

  showToast(message, type = "info") {
    console.log(` ${type.toUpperCase()}: ${message}`)
    alert(message)
  }
}

let fornecedorManager

function showAddFornecedorModal() {
  fornecedorManager.showAddFornecedorModal()
}

function closeFornecedorModal() {
  fornecedorManager.closeFornecedorModal()
}

function closeViewFornecedorModal() {
  fornecedorManager.closeViewFornecedorModal()
}

function saveFornecedorForm(event) {
  event.preventDefault()
  return fornecedorManager.handleFormSubmit(event)
}

function searchFornecedores() {
  fornecedorManager.handleSearch()
}

function filterFornecedores() {
  console.log(" Filtros em desenvolvimento")
}

function exportFornecedores() {
  fornecedorManager.showToast("Funcionalidade de exportação em desenvolvimento", "info")
}

function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} este ${item}?`
  if (confirm(message)) {
    callback()
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log(" 🚀 Inicializando FornecedorManager")
  fornecedorManager = new FornecedorManager()
})
