class CategoriaManager {
  constructor() {
    this.categorias = []
    this.currentEditingId = null
    this.init()
  }

  async init() {
    console.log("🔄 Inicializando gerenciador de categorias")
    await this.loadCategorias()
    this.setupEventListeners()
  }

  setupEventListeners() {
    console.log("🔧 Configurando event listeners")

    // Event listener para busca
    const searchInput = document.getElementById("searchCategoria")
    if (searchInput) {
      searchInput.removeEventListener("input", this.handleSearch)
      searchInput.addEventListener("input", () => this.handleSearch())
      console.log("✅ Event listener de busca configurado")
    }

    // Event listeners para modais
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("categoriaModal")) {
        this.closeCategoriaModal()
      }
    })
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
      console.log("📡 Body da requisição:", finalOptions.body)

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

  async loadCategorias() {
    try {
      this.showLoading(true)
      console.log("��� Carregando categorias...")

      const response = await this.makeAuthenticatedRequest("/api/categorias")
      if (!response || !response.ok) {
        throw new Error("Erro ao carregar categorias")
      }

      const result = await response.json()
      if (result.success) {
        this.categorias = result.data || []
        console.log("✅ Categorias carregadas:", this.categorias.length)
        this.renderCategorias(this.categorias)
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error("❌ Erro ao carregar categorias:", error)
      this.showToast("Erro ao carregar categorias", "error")
      this.renderCategorias([])
    } finally {
      this.showLoading(false)
    }
  }

  renderCategorias(categorias) {
    const tbody = document.getElementById("categoriasTableBody")
    if (!tbody) {
      console.error("❌ Elemento categoriasTableBody não encontrado")
      return
    }

    if (categorias.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Nenhuma categoria encontrada</h5>
                            <p class="text-muted">Clique em "Nova Categoria" para adicionar a primeira categoria.</p>
                        </div>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = categorias
      .map((categoria) => {
        const statusClass = categoria.status ? "" : "inativo"
        const statusText = categoria.status ? "ATIVO" : "INATIVO"
        const statusBadgeClass = categoria.status ? "status-ativo" : "status-inativo"

        return `
                <tr class="categoria-row ${statusClass}" data-id="${categoria.categoria_id}">
                    <td>${categoria.categoria_id}</td>
                    <td class="nome-cell">${this.escapeHtml(categoria.nome)}</td>
                    <td class="descricao-cell">${this.escapeHtml(categoria.descricao || "-")}</td>
                    <td>
                        <span class="status-badge ${statusBadgeClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="actions-column">
                        <div class="action-buttons">
                            <button class="btn-sm btn-edit"
                                    onclick="categoriaManager.editCategoria(${categoria.categoria_id})"
                                    title="Editar categoria">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn-sm ${categoria.status ? "btn-delete" : "btn-edit"}"
                                    onclick="confirmAction('${categoria.status ? "desativar" : "ativar"}', 'categoria', function() { categoriaManager.performToggleStatus(${categoria.categoria_id}, ${!categoria.status}); })"
                                    title="${categoria.status ? "Desativar" : "Ativar"} categoria">
                                <i class="fas ${categoria.status ? "fa-eye-slash" : "fa-eye"}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")

    console.log("✅ Tabela renderizada com", categorias.length, "categorias")
  }

  async performToggleStatus(id, newStatus) {
    try {
      this.showLoading(true)
      console.log("🔄 Alterando status da categoria ID:", id, "para:", newStatus)

      const response = await this.makeAuthenticatedRequest(`/api/categorias/${id}/status`, {
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
      this.showToast(`Categoria ${statusText} com sucesso!`, "success")

      setTimeout(async () => {
        await this.loadCategorias()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao alterar status:", error)
      this.showToast(error.message || "Erro ao alterar status da categoria", "error")
    } finally {
      this.showLoading(false)
    }
  }

  showAddCategoriaModal() {
    console.log("📝 Abrindo modal para nova categoria")
    this.currentEditingId = null
    document.getElementById("categoriaModalTitle").textContent = "Nova Categoria"
    document.getElementById("categoriaForm").reset()
    document.getElementById("categoriaId").value = ""
    document.getElementById("categoriaModal").style.display = "block"

    setTimeout(() => {
      document.getElementById("categoriaNome").focus()
    }, 100)
  }

  async editCategoria(id) {
    console.log("📝 Editando categoria ID:", id)
    const categoria = this.categorias.find((c) => c.categoria_id === id)
    if (!categoria) {
      this.showToast("Categoria não encontrada", "error")
      return
    }

    this.currentEditingId = id
    document.getElementById("categoriaModalTitle").textContent = "Editar Categoria"
    document.getElementById("categoriaId").value = id
    document.getElementById("categoriaNome").value = categoria.nome || ""
    document.getElementById("categoriaDescricao").value = categoria.descricao || ""
    document.getElementById("categoriaStatus").value = categoria.status ? "ativo" : "inativo"
    document.getElementById("categoriaModal").style.display = "block"
  }

  closeCategoriaModal() {
    console.log("📝 Fechando modal de categoria")
    document.getElementById("categoriaModal").style.display = "none"
    document.getElementById("categoriaForm").reset()
    this.currentEditingId = null
  }

  async handleFormSubmit(event) {
    console.log("📝 handleFormSubmit chamada")
    event.preventDefault()

    console.log("📝 Coletando dados do formulário...")
    const formData = new FormData(event.target)

    const categoriaData = {
      nome: formData.get("nome")?.trim() || "",
      descricao: formData.get("descricao")?.trim() || null,
      status: formData.get("status") === "ativo" ? true : false,
    }

    console.log("📝 Dados processados:", categoriaData)

    // Validações
    if (!categoriaData.nome) {
      this.showToast("Nome da categoria é obrigatório", "error")
      return false
    }

    try {
      this.showLoading(true)
      const isEdit = this.currentEditingId !== null
      const url = isEdit ? `/api/categorias/${this.currentEditingId}` : "/api/categorias"
      const method = isEdit ? "PUT" : "POST"

      console.log(`🔄 ${isEdit ? "Atualizando" : "Criando"} categoria:`, categoriaData)

      const response = await this.makeAuthenticatedRequest(url, {
        method: method,
        body: categoriaData,
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        console.error("❌ Resposta da API:", errorData)
        throw new Error(errorData.error || "Erro ao salvar categoria")
      }

      const result = await response.json()
      console.log("✅ Categoria salva com sucesso:", result)

      this.showToast(result.message || `Categoria ${isEdit ? "atualizada" : "criada"} com sucesso!`, "success")
      this.closeCategoriaModal()

      setTimeout(async () => {
        await this.loadCategorias()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao salvar categoria:", error)
      this.showToast(error.message || "Erro ao salvar categoria", "error")
    } finally {
      this.showLoading(false)
    }

    return false
  }

  handleSearch() {
    const searchTerm = document.getElementById("searchCategoria").value.toLowerCase().trim()
    console.log("🔍 Buscando por:", searchTerm)

    if (!searchTerm) {
      console.log("🔍 Busca vazia, mostrando todas as categorias")
      this.renderCategorias(this.categorias)
      return
    }

    const filtered = this.categorias.filter((categoria) => {
      const matches =
        categoria.nome.toLowerCase().includes(searchTerm) ||
        (categoria.descricao && categoria.descricao.toLowerCase().includes(searchTerm))

      if (matches) {
        console.log("🎯 Match encontrado:", categoria.nome)
      }
      return matches
    })

    console.log(`🔍 Busca por "${searchTerm}" encontrou ${filtered.length} categorias`)
    this.renderCategorias(filtered)
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
    toast.textContent = message
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#17a2b8"};
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }
}

// Funções globais para compatibilidade com HTML
let categoriaManager

function showAddCategoriaModal() {
  console.log("🌐 showAddCategoriaModal chamada")
  categoriaManager.showAddCategoriaModal()
}

function closeCategoriaModal() {
  console.log("🌐 closeCategoriaModal chamada")
  categoriaManager.closeCategoriaModal()
}

function saveCategoriaForm(event) {
  console.log("🌐 saveCategoriaForm chamada - prevenindo submit padrão")
  event.preventDefault()
  return categoriaManager.handleFormSubmit(event)
}

function searchCategorias() {
  console.log("🌐 searchCategorias chamada (DEPRECIADA)")
  categoriaManager.handleSearch()
}

function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} esta ${item}?`
  if (confirm(message)) {
    callback()
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Inicializando CategoriaManager")
  categoriaManager = new CategoriaManager()
})
