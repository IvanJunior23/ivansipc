class FornecedorManager {
  constructor() {
    this.fornecedores = []
    this.pessoas = []
    this.currentEditingId = null
    this.init()
  }

  async init() {
    console.log(" 🔄 Inicializando gerenciador de fornecedores")
    await this.loadFornecedores()
    await this.loadPessoas()
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

    const pessoaSelect = document.getElementById("pessoaSelect")
    if (pessoaSelect) {
      pessoaSelect.addEventListener("change", () => this.onPessoaSelected())
    }
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
        console.log(" 📋 Dados dos fornecedores:", this.fornecedores)
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

  async loadPessoas() {
    try {
      console.log(" 🔄 Carregando pessoas da API...")

      const response = await this.makeAuthenticatedRequest("/api/pessoas?incluir_inativos=true")
      if (!response || !response.ok) {
        throw new Error("Erro ao carregar pessoas")
      }

      const result = await response.json()
      console.log(" 📦 Resposta da API de pessoas:", result)

      if (result.success) {
        this.pessoas = result.data || []
        console.log(" ✅ Pessoas carregadas:", this.pessoas.length)
        this.populatePessoaSelect()
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error(" ❌ Erro ao carregar pessoas:", error)
      this.showToast("Erro ao carregar pessoas", "error")
    }
  }

  populatePessoaSelect() {
    const select = document.getElementById("pessoaSelect")
    if (!select) return

    select.innerHTML = '<option value="">-- Selecione uma pessoa ou preencha manualmente --</option>'

    this.pessoas.forEach((pessoa) => {
      const option = document.createElement("option")
      option.value = pessoa.pessoa_id
      option.textContent = `${pessoa.nome} (ID: ${pessoa.pessoa_id})`
      select.appendChild(option)
    })

    console.log(" ✅ Seletor de pessoas populado com", this.pessoas.length, "opções")
  }

  async onPessoaSelected() {
    const select = document.getElementById("pessoaSelect")
    const selectedOption = select.options[select.selectedIndex]
    const pessoaInfo = document.getElementById("pessoaInfo")

    if (!selectedOption.value) {
      pessoaInfo.style.display = "none"
      return
    }

    try {
      const pessoaId = selectedOption.value
      console.log(" 👤 Carregando dados completos da pessoa ID:", pessoaId)

      const response = await this.makeAuthenticatedRequest(`/api/pessoas/${pessoaId}`)
      if (!response || !response.ok) {
        throw new Error("Erro ao carregar dados da pessoa")
      }

      const result = await response.json()
      console.log(" 📦 Dados completos da pessoa:", result)

      if (result.success && result.data) {
        const pessoa = result.data
        console.log(" ✅ Mostrando dados da pessoa:", pessoa)

        document.getElementById("pessoaNome").textContent = pessoa.nome || "-"

        pessoaInfo.style.display = "block"
        this.showToast("Pessoa selecionada com sucesso!", "success")
      }
    } catch (error) {
      console.error(" ❌ Erro ao carregar dados da pessoa:", error)
      this.showToast("Erro ao carregar dados da pessoa", "error")
      pessoaInfo.style.display = "none"
    }
  }

  clearFormFields() {
    console.log(" 🧹 Limpando campos do formulário")
    document.getElementById("fornecedorNome").value = ""
    document.getElementById("fornecedorEmail").value = ""
    document.getElementById("fornecedorTelefone").value = ""
    document.getElementById("fornecedorLogradouro").value = ""
    document.getElementById("fornecedorNumero").value = ""
    document.getElementById("fornecedorComplemento").value = ""
    document.getElementById("fornecedorBairro").value = ""
    document.getElementById("fornecedorCidade").value = ""
    document.getElementById("fornecedorEstado").value = ""
    document.getElementById("fornecedorCep").value = ""
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

    const pessoaSelect = document.getElementById("pessoaSelect")
    if (pessoaSelect) {
      pessoaSelect.value = ""
      pessoaSelect.disabled = false // Habilitar select para novo fornecedor
    }

    document.getElementById("pessoaInfo").style.display = "none"
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

    document.getElementById("fornecedorCnpj").value = fornecedor.cnpj || ""

    const pessoaSelect = document.getElementById("pessoaSelect")
    if (pessoaSelect && fornecedor.pessoa_id) {
      pessoaSelect.value = fornecedor.pessoa_id
      pessoaSelect.disabled = true
      await this.onPessoaSelected()
    }

    document.getElementById("fornecedorModal").style.display = "block"
  }

  closeFornecedorModal() {
    console.log(" 📝 Fechando modal de fornecedor")
    document.getElementById("fornecedorModal").style.display = "none"
    document.getElementById("fornecedorForm").reset()
    document.getElementById("pessoaInfo").style.display = "none"

    const pessoaSelect = document.getElementById("pessoaSelect")
    if (pessoaSelect) pessoaSelect.disabled = false

    this.currentEditingId = null
  }

  closeViewFornecedorModal() {
    console.log(" 📝 Fechando modal de visualização")
    document.getElementById("viewFornecedorModal").style.display = "none"
  }

  async handleFormSubmit(event) {
    console.log(" 📝 handleFormSubmit chamada")
    event.preventDefault()

    const formData = new FormData(event.target)
    const userData = await window.auth.getCurrentUser()

    const fornecedorData = {
      pessoa_id: Number.parseInt(formData.get("pessoa_id")),
      cnpj: formData.get("cnpj")?.trim(),
    }

    if (this.currentEditingId) {
      fornecedorData.updated_by = userData.usuario_id
    } else {
      fornecedorData.created_by = userData.usuario_id
    }

    if (!fornecedorData.pessoa_id || isNaN(fornecedorData.pessoa_id)) {
      this.showToast("Por favor, selecione uma pessoa válida", "error")
      return false
    }

    if (!fornecedorData.cnpj) {
      this.showToast("Por favor, informe o CNPJ", "error")
      return false
    }

    console.log(" 📝 Dados processados:", fornecedorData)

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
