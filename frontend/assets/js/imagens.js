class ImagemManager {
  constructor() {
    this.imagens = []
    this.currentEditingId = null
    this.selectedFiles = []
    this.init()
  }

  async init() {
    console.log("🔄 Inicializando gerenciador de imagens")
    await this.loadImagens()
    this.setupEventListeners()
    this.setupUploadArea()
  }

  setupEventListeners() {
    console.log("🔧 Configurando event listeners")

    // Event listener para busca
    const searchInput = document.getElementById("searchImagem")
    if (searchInput) {
      searchInput.removeEventListener("input", this.handleSearch)
      searchInput.addEventListener("input", () => this.handleSearch())
      console.log("✅ Event listener de busca configurado")
    }

    // Event listeners para modais
    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("imagemModal")) {
        this.closeImagemModal()
      }
      if (e.target === document.getElementById("imagePreviewModal")) {
        this.closeImagePreview()
      }
      if (e.target === document.getElementById("uploadModal")) {
        this.closeUploadModal()
      }
    })
  }

  setupUploadArea() {
    const uploadAreas = document.querySelectorAll(".upload-area")
    const fileInput = document.getElementById("modalFileInput")

    uploadAreas.forEach((uploadArea) => {
      // Drag & Drop events
      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault()
        uploadArea.classList.add("dragover")
      })

      uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover")
      })

      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault()
        uploadArea.classList.remove("dragover")
        const files = e.dataTransfer.files
        this.handleFileSelection(files)
      })
    })

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        this.handleFileSelection(e.target.files)
      })
    }
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
        Authorization: `Bearer ${token}`,
      },
    }

    // Only add Content-Type for JSON requests
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      defaultOptions.headers["Content-Type"] = "application/json"
    }

    const finalOptions = { ...defaultOptions, ...options }
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
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

  async loadImagens() {
    try {
      this.showLoading(true)
      console.log("📷 Carregando imagens...")

      const response = await this.makeAuthenticatedRequest("/api/imagens?incluir_inativos=true")
      if (!response || !response.ok) {
        throw new Error("Erro ao carregar imagens")
      }

      const result = await response.json()
      if (result.success) {
        this.imagens = result.data || []
        console.log("✅ Imagens carregadas:", this.imagens.length)
        this.renderImagens(this.imagens)
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error("❌ Erro ao carregar imagens:", error)
      this.showToast("Erro ao carregar imagens", "error")
      this.renderImagens([])
    } finally {
      this.showLoading(false)
    }
  }

  renderImagens(imagens) {
    const tbody = document.getElementById("imagensTableBody")
    if (!tbody) {
      console.error("❌ Elemento imagensTableBody não encontrado")
      return
    }

    if (imagens.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-images fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Nenhuma imagem encontrada</h5>
                            <p class="text-muted">Clique em "Upload de Imagens" para adicionar a primeira imagem.</p>
                        </div>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = imagens
      .map((imagem) => {
        const statusClass = imagem.status ? "" : "inativo"
        const statusText = imagem.status ? "ATIVO" : "INATIVO"
        const statusBadgeClass = imagem.status ? "status-ativo" : "status-inativo"
        const fileName = imagem.referencia_url ? imagem.referencia_url.split("/").pop() : "sem-arquivo"

        return `
                <tr class="imagem-row ${statusClass}" data-id="${imagem.imagem_id}">
                    <td>${imagem.imagem_id}</td>
                    <td>
                        <img 
                            src="http://localhost:3000/api/imagens/serve/${fileName}" 
                            alt="${this.escapeHtml(imagem.descricao || "Imagem")}" 
                            class="image-thumbnail"
                            onclick="imagemManager.openImageInNewTab('${fileName}')"
                            onerror="this.src='/placeholder.svg?height=50&width=50'"
                        >
                    </td>
                    <td class="nome-cell">${this.escapeHtml(fileName)}</td>
                    <td class="descricao-cell">${this.escapeHtml(imagem.descricao || "-")}</td>
                    <td>
                        <span class="status-badge ${statusBadgeClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit"
                                    onclick="imagemManager.editImagem(${imagem.imagem_id})"
                                    title="Editar imagem">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn-toggle-status"
                                    onclick="confirmAction('${imagem.status ? "desativar" : "ativar"}', 'imagem', function() { imagemManager.performToggleStatus(${imagem.imagem_id}, ${!imagem.status}); })"
                                    title="${imagem.status ? "Desativar" : "Ativar"} imagem">
                                <i class="fas ${imagem.status ? "fa-eye-slash" : "fa-eye"}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")

    console.log("✅ Tabela renderizada com", imagens.length, "imagens (incluindo ativas e inativas)")
  }

  async handleFileSelection(files) {
    if (!files || files.length === 0) return

    const validFiles = []
    const filesList = document.getElementById("filesList")
    const selectedFilesDiv = document.getElementById("selectedFiles")
    const saveBtn = document.getElementById("saveUploadBtn")

    // Clear previous selection
    filesList.innerHTML = ""

    // Validate files
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        this.showToast(`Arquivo ${file.name} é muito grande. Máximo 5MB.`, "error")
        continue
      }

      if (!file.type.startsWith("image/")) {
        this.showToast(`Arquivo ${file.name} não é uma imagem válida.`, "error")
        continue
      }

      validFiles.push(file)
      const li = document.createElement("li")
      li.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      filesList.appendChild(li)
    }

    if (validFiles.length > 0) {
      selectedFilesDiv.style.display = "block"
      saveBtn.disabled = false
      this.selectedFiles = validFiles
    } else {
      selectedFilesDiv.style.display = "none"
      saveBtn.disabled = true
      this.selectedFiles = []
    }
  }

  async handleFormUpload(event) {
    event.preventDefault()

    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.showToast("Nenhum arquivo selecionado.", "error")
      return false
    }

    const formData = new FormData()

    // Add selected files
    for (const file of this.selectedFiles) {
      formData.append("imagens", file)
    }

    const uploadDescricao = document.getElementById("uploadDescricao")
    const descricao = uploadDescricao ? uploadDescricao.value.trim() : ""
    formData.append("descricao", descricao || "Imagem enviada via upload")

    try {
      this.showLoading(true)
      console.log("📤 Enviando arquivos:", this.selectedFiles.length)

      const response = await this.makeAuthenticatedRequest("/api/imagens/upload", {
        method: "POST",
        body: formData,
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(errorData.error || "Erro no upload")
      }

      const result = await response.json()
      console.log("✅ Upload realizado com sucesso:", result)

      this.showToast(result.message || "Imagens enviadas com sucesso!", "success")
      this.closeUploadModal()

      // Reload images
      setTimeout(async () => {
        await this.loadImagens()
      }, 500)
    } catch (error) {
      console.error("❌ Erro no upload:", error)
      this.showToast(error.message || "Erro ao enviar arquivos", "error")
    } finally {
      this.showLoading(false)
    }

    return false
  }

  async performToggleStatus(id, newStatus) {
    try {
      this.showLoading(true)
      console.log("🔄 Alterando status da imagem ID:", id, "para:", newStatus)

      const response = await this.makeAuthenticatedRequest(`/api/imagens/${id}/status`, {
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
      this.showToast(`Imagem ${statusText} com sucesso!`, "success")

      setTimeout(async () => {
        await this.loadImagens()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao alterar status:", error)
      this.showToast(error.message || "Erro ao alterar status da imagem", "error")
    } finally {
      this.showLoading(false)
    }
  }

  async performDelete(id) {
    console.log("🚫 Função de deletar removida - use apenas ativar/desativar")
    this.showToast("Use a função de ativar/desativar ao invés de excluir", "info")
  }

  showUploadModal() {
    console.log("📤 Abrindo modal de upload")
    document.getElementById("uploadModal").style.display = "block"
    this.selectedFiles = []
    document.getElementById("selectedFiles").style.display = "none"
    document.getElementById("saveUploadBtn").disabled = true
  }

  closeUploadModal() {
    console.log("📤 Fechando modal de upload")
    document.getElementById("uploadModal").style.display = "none"
    const uploadDescricao = document.getElementById("uploadDescricao")
    const fileInput = document.getElementById("modalFileInput")

    if (uploadDescricao) {
      uploadDescricao.value = ""
    }
    if (fileInput) {
      fileInput.value = ""
    }

    this.selectedFiles = []
    document.getElementById("selectedFiles").style.display = "none"
    document.getElementById("saveUploadBtn").disabled = true
  }

  showImagePreview(fileName) {
    console.log("👁️ Mostrando preview da imagem:", fileName)
    const modal = document.getElementById("imagePreviewModal")
    const img = document.getElementById("previewImage")

    img.src = `http://localhost:3000/api/imagens/serve/${fileName}`
    modal.style.display = "block"
  }

  closeImagePreview() {
    console.log("👁️ Fechando preview da imagem")
    document.getElementById("imagePreviewModal").style.display = "none"
  }

  async editImagem(id) {
    console.log("��� Editando imagem ID:", id)
    const imagem = this.imagens.find((img) => img.imagem_id === id)
    if (!imagem) {
      this.showToast("Imagem não encontrada", "error")
      return
    }

    this.currentEditingId = id
    this.currentEditingImage = imagem
    document.getElementById("imagemModalTitle").textContent = "Editar Imagem"
    document.getElementById("imagemId").value = id
    document.getElementById("imagemDescricao").value = imagem.descricao || ""
    document.getElementById("imagemStatus").value = imagem.status ? "1" : "0"
    document.getElementById("imagemModal").style.display = "block"
  }

  closeImagemModal() {
    console.log("📝 Fechando modal de imagem")
    document.getElementById("imagemModal").style.display = "none"
    document.getElementById("imagemForm").reset()
    this.currentEditingId = null
    this.currentEditingImage = null
  }

  async handleFormSubmit(event) {
    console.log("📝 handleFormSubmit chamada")
    event.preventDefault()

    console.log("📝 Coletando dados do formulário...")
    const formData = new FormData(event.target)

    const imagemData = {
      referencia_url: this.currentEditingImage?.referencia_url || "",
      descricao: formData.get("descricao")?.trim() || "",
      status: Number.parseInt(formData.get("status")) || 0,
    }

    console.log("📝 Dados processados:", imagemData)

    // Validações
    if (!imagemData.descricao) {
      this.showToast("Descrição da imagem é obrigatória", "error")
      return false
    }

    if (!imagemData.referencia_url) {
      this.showToast("Erro: referência da imagem não encontrada", "error")
      return false
    }

    try {
      this.showLoading(true)
      const id = this.currentEditingId

      console.log("🔄 Atualizando imagem:", imagemData)

      const response = await this.makeAuthenticatedRequest(`/api/imagens/${id}`, {
        method: "PUT",
        body: imagemData,
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        console.error("❌ Resposta da API:", errorData)
        throw new Error(errorData.error || "Erro ao salvar imagem")
      }

      const result = await response.json()
      console.log("✅ Imagem salva com sucesso:", result)

      this.showToast(result.message || "Imagem atualizada com sucesso!", "success")
      this.closeImagemModal()

      setTimeout(async () => {
        await this.loadImagens()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao salvar imagem:", error)
      this.showToast(error.message || "Erro ao salvar imagem", "error")
    } finally {
      this.showLoading(false)
    }

    return false
  }

  handleSearch() {
    const searchTerm = document.getElementById("searchImagem").value.toLowerCase().trim()
    console.log("🔍 Buscando por:", searchTerm)

    if (!searchTerm) {
      console.log("🔍 Busca vazia, mostrando todas as imagens")
      this.renderImagens(this.imagens)
      return
    }

    const filtered = this.imagens.filter((imagem) => {
      const matches =
        (imagem.descricao && imagem.descricao.toLowerCase().includes(searchTerm)) ||
        (imagem.referencia_url && imagem.referencia_url.toLowerCase().includes(searchTerm))

      if (matches) {
        console.log("🎯 Match encontrado:", imagem.descricao)
      }
      return matches
    })

    console.log(`🔍 Busca por "${searchTerm}" encontrou ${filtered.length} imagens`)
    this.renderImagens(filtered)
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

  openImageInNewTab(fileName) {
    console.log("🔗 Abrindo imagem em nova aba:", fileName)
    const imageUrl = `http://localhost:3000/api/imagens/serve/${fileName}`
    window.open(imageUrl, "_blank", "noopener,noreferrer")
  }
}

// Funções globais para compatibilidade com HTML
let imagemManager

function showUploadModal() {
  console.log("🌐 showUploadModal chamada")
  imagemManager.showUploadModal()
}

function closeUploadModal() {
  console.log("🌐 closeUploadModal chamada")
  imagemManager.closeUploadModal()
}

function closeImagemModal() {
  console.log("🌐 closeImagemModal chamada")
  imagemManager.closeImagemModal()
}

function saveImagemForm(event) {
  console.log("🌐 saveImagemForm chamada - prevenindo submit padrão")
  event.preventDefault()
  return imagemManager.handleFormSubmit(event)
}

function saveUploadForm(event) {
  console.log("🌐 saveUploadForm chamada - prevenindo submit padrão")
  event.preventDefault()
  return imagemManager.handleFormUpload(event)
}

function searchImagens() {
  console.log("🌐 searchImagens chamada (DEPRECIADA)")
  imagemManager.handleSearch()
}

function closeImagePreview() {
  console.log("🌐 closeImagePreview chamada")
  imagemManager.closeImagePreview()
}

function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} esta ${item}?`
  if (confirm(message)) {
    callback()
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Inicializando ImagemManager")
  imagemManager = new ImagemManager()
})
