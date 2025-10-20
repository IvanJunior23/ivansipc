class PessoaManager {
  constructor() {
    this.pessoas = []
    this.contatos = []
    this.enderecos = []
    this.currentEditingId = null
    this.isSubmitting = false
    this.init()
  }

  async init() {
    console.log("🔄 Inicializando gerenciador de pessoas")
    await this.loadPessoas()
    await this.loadContatos()
    await this.loadEnderecos()
    this.setupEventListeners()
    this.setupCEPMask()
    this.setupPhoneMasks()
  }

  setupEventListeners() {
    console.log("🔧 Configurando event listeners")
    const searchInput = document.getElementById("searchPessoa")
    if (searchInput) {
      searchInput.removeEventListener("input", this.handleSearch)
      searchInput.addEventListener("input", () => this.handleSearch())
      console.log("✅ Event listener de busca configurado")
    }

    window.addEventListener("click", (e) => {
      if (e.target === document.getElementById("pessoaModal")) {
        this.closePessoaModal()
      }
    })
  }

  setupCEPMask() {
    const cepInput = document.getElementById("pessoaCep")
    if (cepInput) {
      cepInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "")
        if (value.length >= 6) {
          value = value.replace(/^(\d{5})(\d)/, "$1-$2")
        }
        e.target.value = value
        if (value.replace(/\D/g, "").length === 8) {
          this.fetchAddressByCEP(value.replace(/\D/g, ""))
        }
      })
    }
  }

  setupPhoneMasks() {
    const telefoneInput = document.getElementById("pessoaTelefone")
    if (telefoneInput) {
      telefoneInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "")
        if (value.length <= 10) {
          value = value.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3")
        } else {
          value = value.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3")
        }
        e.target.value = value
      })
    }

    const celularInput = document.getElementById("pessoaCelular")
    if (celularInput) {
      celularInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "")
        if (value.length <= 11) {
          value = value.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3")
        }
        e.target.value = value
      })
    }
  }

  async fetchAddressByCEP(cep) {
    try {
      console.log("🔍 Buscando endereço por CEP:", cep)
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        document.getElementById("pessoaLogradouro").value = data.logradouro || ""
        document.getElementById("pessoaBairro").value = data.bairro || ""
        document.getElementById("pessoaCidade").value = data.localidade || ""
        document.getElementById("pessoaEstado").value = data.uf || ""
        document.getElementById("pessoaNumero").focus()
        console.log("✅ Endereço preenchido automaticamente")
      } else {
        console.log("⚠️ CEP não encontrado")
      }
    } catch (error) {
      console.error("❌ Erro ao buscar CEP:", error)
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

  async loadPessoas() {
    try {
      this.showLoading(true)
      console.log("🔄 Carregando pessoas...")
      const response = await this.makeAuthenticatedRequest("/api/pessoas")

      if (!response || !response.ok) {
        throw new Error("Erro ao carregar pessoas")
      }

      const result = await response.json()
      if (result.success) {
        this.pessoas = result.data || []
        console.log("✅ Pessoas carregadas:", this.pessoas.length)
        this.renderPessoas(this.pessoas)
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error("❌ Erro ao carregar pessoas:", error)
      this.showToast("Erro ao carregar pessoas", "error")
      this.renderPessoas([])
    } finally {
      this.showLoading(false)
    }
  }

  async loadContatos() {
    try {
      console.log(" Carregando contatos...")
      const response = await this.makeAuthenticatedRequest("/api/contatos")

      if (!response || !response.ok) {
        console.log(" ERRO: Resposta inválida ao carregar contatos:", response?.status)
        throw new Error("Erro ao carregar contatos")
      }

      const result = await response.json()
      console.log(" Resposta da API contatos:", result)

      if (result.success) {
        this.contatos = result.data || []
        console.log(" Contatos carregados com sucesso:", this.contatos.length)
        this.populateContatosDropdown()
      } else {
        console.log(" ERRO: API retornou success=false:", result.error)
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error(" ERRO ao carregar contatos:", error)
      this.contatos = []
      this.populateContatosDropdown()
    }
  }

  async loadEnderecos() {
    try {
      console.log(" Carregando endereços...")
      const response = await this.makeAuthenticatedRequest("/api/enderecos")

      if (!response || !response.ok) {
        console.log(" ERRO: Resposta inválida ao carregar endereços:", response?.status)
        throw new Error("Erro ao carregar endereços")
      }

      const result = await response.json()
      console.log(" Resposta da API endereços:", result)

      if (result.success) {
        this.enderecos = result.data || []
        console.log(" Endereços carregados com sucesso:", this.enderecos.length)
        this.populateEnderecosDropdown()
      } else {
        console.log(" ERRO: API retornou success=false:", result.error)
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error(" ERRO ao carregar endereços:", error)
      this.enderecos = []
      this.populateEnderecosDropdown()
    }
  }

  populateContatosDropdown() {
    console.log(" Iniciando populateContatosDropdown")
    const select = document.getElementById("pessoaContato")
    if (!select) {
      console.log(" ERRO: Elemento pessoaContato não encontrado no DOM")
      return
    }

    console.log(" Elemento pessoaContato encontrado, contatos disponíveis:", this.contatos.length)
    select.innerHTML = '<option value="">Selecione um contato...</option>'

    this.contatos.forEach((contato) => {
      console.log(" Processando contato:", contato)
      const option = document.createElement("option")
      option.value = contato.contato_id
      let displayText = contato.nome_completo || "Sem nome"
      if (contato.telefone) {
        displayText += ` - ${contato.telefone}`
      }
      if (contato.email) {
        displayText += ` - ${contato.email}`
      }
      option.textContent = displayText
      select.appendChild(option)
    })

    console.log(" Dropdown de contatos populado com", this.contatos.length, "itens")
  }

  populateEnderecosDropdown() {
    console.log(" Iniciando populateEnderecosDropdown")
    const select = document.getElementById("pessoaEndereco")
    if (!select) {
      console.log(" ERRO: Elemento pessoaEndereco não encontrado no DOM")
      return
    }

    console.log(" Elemento pessoaEndereco encontrado, endereços disponíveis:", this.enderecos.length)
    select.innerHTML = '<option value="">Selecione um endereço...</option>'

    this.enderecos.forEach((endereco) => {
      console.log(" Processando endereço:", endereco)
      const option = document.createElement("option")
      option.value = endereco.endereco_id
      let displayText = ""
      if (endereco.logradouro) {
        displayText += endereco.logradouro
      }
      if (endereco.numero) {
        displayText += `, ${endereco.numero}`
      }
      if (endereco.bairro) {
        displayText += ` - ${endereco.bairro}`
      }
      if (endereco.cidade) {
        displayText += ` - ${endereco.cidade}`
      }
      if (endereco.cep) {
        displayText += ` (${endereco.cep})`
      }
      option.textContent = displayText || "Endereço sem informações"
      select.appendChild(option)
    })

    console.log(" Dropdown de endereços populado com", this.enderecos.length, "itens")
  }

  renderPessoas(pessoas) {
    const tbody = document.getElementById("pessoasTableBody")
    if (!tbody) {
      console.error("❌ Elemento pessoasTableBody não encontrado")
      return
    }

    if (pessoas.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-user fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Nenhuma pessoa encontrada</h5>
                            <p class="text-muted">Clique em "Nova Pessoa" para adicionar a primeira pessoa.</p>
                        </div>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = pessoas
      .map((pessoa) => {
        const statusClass = pessoa.status ? "" : "inativo"
        const statusText = pessoa.status ? "ATIVO" : "INATIVO"
        const statusBadgeClass = pessoa.status ? "status-ativo" : "status-inativo"
        const createdDate = this.formatDate(pessoa.created_at)

        const enderecoResumo = pessoa.endereco
          ? `${pessoa.endereco.logradouro}, ${pessoa.endereco.numero} - ${pessoa.endereco.bairro}`
          : "Sem endereço"

        let contatoResumo = "Sem contato"
        if (pessoa.contato) {
          const telefone = pessoa.contato.celular || pessoa.contato.telefone
          const email = pessoa.contato.email

          if (telefone && email) {
            contatoResumo = `${telefone} | ${email}`
          } else if (telefone) {
            contatoResumo = telefone
          } else if (email) {
            contatoResumo = email
          }
        }

        return `
                <tr class="pessoa-row ${statusClass}" data-id="${pessoa.pessoa_id}">
                    <td>${pessoa.pessoa_id}</td>
                    <td class="nome-cell">${this.escapeHtml(pessoa.nome)}</td>
                    <td class="endereco-cell" title="${this.escapeHtml(enderecoResumo)}">${this.truncateText(enderecoResumo, 30)}</td>
                    <td class="contato-cell" title="${this.escapeHtml(contatoResumo)}">${this.truncateText(contatoResumo, 35)}</td>
                    <td class="data-cell">${createdDate}</td>
                    <td class="actions-column">
                        <div class="action-buttons">
                            <span class="status-badge ${statusBadgeClass}">
                                ${statusText}
                            </span>
                            <button class="btn-edit"
                                    onclick="pessoaManager.editPessoa(${pessoa.pessoa_id})"
                                    title="Editar pessoa">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn-toggle-status"
                                    onclick="confirmAction('${pessoa.status ? "desativar" : "ativar"}', 'pessoa', function() { pessoaManager.performToggleStatus(${pessoa.pessoa_id}, ${!pessoa.status}); })"
                                    title="${pessoa.status ? "Desativar" : "Ativar"} pessoa">
                                <i class="fas ${pessoa.status ? "fa-eye-slash" : "fa-eye"}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")

    console.log("✅ Tabela renderizada com", pessoas.length, "pessoas")
  }

  async performToggleStatus(id, newStatus) {
    try {
      this.showLoading(true)
      console.log("🔄 Alterando status da pessoa ID:", id, "para:", newStatus)

      const response = await this.makeAuthenticatedRequest(`/api/pessoas/${id}/status`, {
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
      this.showToast(`Pessoa ${statusText} com sucesso!`, "success")

      setTimeout(async () => {
        await this.loadPessoas()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao alterar status:", error)
      this.showToast(error.message || "Erro ao alterar status da pessoa", "error")
    } finally {
      this.showLoading(false)
    }
  }

  showAddPessoaModal() {
    console.log("📝 Abrindo modal para nova pessoa")
    this.currentEditingId = null
    document.getElementById("pessoaModalTitle").textContent = "Nova Pessoa"
    document.getElementById("pessoaForm").reset()
    document.getElementById("pessoaId").value = ""
    document.getElementById("pessoaContato").value = ""
    document.getElementById("pessoaEndereco").value = ""
    document.getElementById("pessoaModal").style.display = "block"

    setTimeout(() => {
      document.getElementById("pessoaNome").focus()
    }, 100)
  }

  async editPessoa(id) {
    console.log("📝 Editando pessoa ID:", id)
    try {
      const response = await this.makeAuthenticatedRequest(`/api/pessoas/${id}`)
      if (!response || !response.ok) {
        throw new Error("Erro ao carregar dados da pessoa")
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Pessoa não encontrada")
      }

      const pessoa = result.data
      this.currentEditingId = id
      document.getElementById("pessoaModalTitle").textContent = "Editar Pessoa"

      document.getElementById("pessoaId").value = id
      document.getElementById("pessoaNome").value = pessoa.nome || ""

      document.getElementById("pessoaContato").value = pessoa.contato_id || ""
      document.getElementById("pessoaEndereco").value = pessoa.endereco_id || ""

      document.getElementById("pessoaModal").style.display = "block"
    } catch (error) {
      console.error("❌ Erro ao carregar pessoa:", error)
      this.showToast(error.message || "Erro ao carregar dados da pessoa", "error")
    }
  }

  closePessoaModal() {
    console.log("📝 Fechando modal de pessoa")
    document.getElementById("pessoaModal").style.display = "none"
    document.getElementById("pessoaForm").reset()
    this.currentEditingId = null
    this.isSubmitting = false
  }

  async handleFormSubmit(event) {
    console.log("📝 handleFormSubmit chamada")
    event.preventDefault()

    if (this.isSubmitting) {
      console.log("⏳ Submissão já em andamento, ignorando...")
      return false
    }

    this.isSubmitting = true

    try {
      console.log("📝 Coletando dados do formulário...")

      const contatoSelect = document.getElementById("pessoaContato")
      const enderecoSelect = document.getElementById("pessoaEndereco")

      console.log(" Elemento contato encontrado:", !!contatoSelect)
      console.log(" Elemento endereco encontrado:", !!enderecoSelect)

      const contatoValue = contatoSelect ? contatoSelect.value : ""
      const enderecoValue = enderecoSelect ? enderecoSelect.value : ""

      console.log(" Valor bruto contato:", contatoValue)
      console.log(" Valor bruto endereco:", enderecoValue)

      const pessoaData = {
        nome: document.getElementById("pessoaNome").value.trim(),
        contato_id: contatoValue && contatoValue !== "" ? Number.parseInt(contatoValue) : null,
        endereco_id: enderecoValue && enderecoValue !== "" ? Number.parseInt(enderecoValue) : null,
        status: 1,
      }

      console.log("📝 Dados coletados dos campos:")
      console.log("- Nome:", pessoaData.nome)
      console.log("- Contato ID (convertido):", pessoaData.contato_id)
      console.log("- Endereço ID (convertido):", pessoaData.endereco_id)

      if (!pessoaData.nome) {
        this.showToast("Nome é obrigatório", "error")
        return false
      }

      console.log("🔍 DIAGNÓSTICO DETALHADO:")
      console.log("Dados finais para envio:", pessoaData)

      await this.savePessoa(pessoaData)
      return true
    } catch (error) {
      console.error("❌ Erro no formulário:", error)
      this.showToast(error.message || "Erro ao salvar pessoa", "error")
      return false
    } finally {
      this.isSubmitting = false
    }
  }

  async savePessoa(data) {
    try {
      this.showLoading(true)
      const isEdit = this.currentEditingId !== null
      const url = isEdit ? `/api/pessoas/${this.currentEditingId}` : "/api/pessoas"
      const method = isEdit ? "PUT" : "POST"

      console.log(`🔄 ${isEdit ? "Atualizando" : "Criando"} pessoa:`, data)

      const response = await this.makeAuthenticatedRequest(url, {
        method: method,
        body: data,
      })

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        console.error("❌ Resposta da API:", errorData)
        throw new Error(errorData.error || "Erro ao salvar pessoa")
      }

      const result = await response.json()
      console.log("✅ Pessoa salva com sucesso:", result)

      this.showToast(result.message || `Pessoa ${isEdit ? "atualizada" : "criada"} com sucesso!`, "success")

      this.closePessoaModal()

      setTimeout(async () => {
        await this.loadPessoas()
      }, 500)
    } catch (error) {
      console.error("❌ Erro ao salvar pessoa:", error)
      throw error
    } finally {
      this.showLoading(false)
    }
  }

  handleSearch() {
    const searchTerm = document.getElementById("searchPessoa").value.toLowerCase().trim()
    console.log("🔍 Buscando por:", searchTerm)

    if (!searchTerm) {
      console.log("🔍 Busca vazia, mostrando todas as pessoas")
      this.renderPessoas(this.pessoas)
      return
    }

    const filtered = this.pessoas.filter((pessoa) => {
      const nomeMatch = pessoa.nome.toLowerCase().includes(searchTerm)

      if (nomeMatch) {
        console.log("🎯 Match encontrado:", pessoa.nome)
      }

      return nomeMatch
    })

    console.log(`🔍 Busca por "${searchTerm}" encontrou ${filtered.length} pessoas`)
    this.renderPessoas(filtered)
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  formatDate(dateString) {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "-"
    }
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text || ""
    return div.innerHTML
  }

  showLoading(show) {
    console.log(show ? "⏳ Carregando..." : "✅ Carregamento concluído")
    const loadingElement = document.getElementById("loadingIndicator")
    if (loadingElement) {
      loadingElement.style.display = show ? "block" : "none"
    }
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
            background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : type === "warning" ? "#ffc107" : "#17a2b8"};
            color: ${type === "warning" ? "#000" : "#fff"};
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease"
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
}

let pessoaManager

function showAddPessoaModal() {
  console.log("🌐 showAddPessoaModal chamada")
  pessoaManager.showAddPessoaModal()
}

function closePessoaModal() {
  console.log("🌐 closePessoaModal chamada")
  pessoaManager.closePessoaModal()
}

function savePessoaForm(event) {
  console.log("🌐 savePessoaForm chamada - prevenindo submit padrão")
  event.preventDefault()
  return pessoaManager.handleFormSubmit(event)
}

function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} esta ${item}?`
  if (confirm(message)) {
    callback()
  }
}

const styles = document.createElement("style")
styles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .pessoa-row.inativo {
        opacity: 0.5;
        background-color: #f8f9fa;
        color: #6c757d;
    }
    .pessoa-row.inativo .nome-cell,
    .pessoa-row.inativo .endereco-cell,
    .pessoa-row.inativo .contato-cell,
    .pessoa-row.inativo .data-cell {
        color: #6c757d;
    }
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    .status-ativo {
        background-color: #d4edda;
        color: #155724;
    }
    .status-inativo {
        background-color: #f8d7da;
        color: #721c24;
    }
    .action-buttons {
        display: flex;
        gap: 5px;
        align-items: center;
    }
    .btn-edit, .btn-toggle-status {
        padding: 5px 8px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    .btn-edit {
        background-color: #007bff;
        color: white;
    }
    .btn-toggle-status {
        background-color: #6c757d;
        color: white;
    }
    .btn-edit:hover {
        background-color: #0056b3;
    }
    .btn-toggle-status:hover {
        background-color: #545b62;
    }
    .empty-state {
        padding: 2rem;
    }
    .empty-state i {
        display: block;
        margin-bottom: 1rem;
    }
`
document.head.appendChild(styles)

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Inicializando PessoaManager")
  pessoaManager = new PessoaManager()
})
