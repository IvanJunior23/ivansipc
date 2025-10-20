// frontend/assets/js/usuarios.js
document.addEventListener("DOMContentLoaded", () => {
  const auth = window.auth // Declare the auth variable here
  if (typeof auth === "undefined" || !auth.isAuthenticated()) return

  let allUsers = []
  let allPessoas = [] // Adicionando array para armazenar pessoas
  const form = document.getElementById("usuarioForm")
  const tableBody = document.getElementById("usuariosTableBody")
  const formTitle = document.getElementById("usuarioModalTitle")
  const modal = document.getElementById("usuarioModal")
  const idInput = document.getElementById("usuarioId")

  // Função para mostrar loading
  function showLoading(show = true) {
    const loadingEl = document.getElementById("loading") || createLoadingElement()
    loadingEl.style.display = show ? "flex" : "none"
  }

  function createLoadingElement() {
    const loading = document.createElement("div")
    loading.id = "loading"
    loading.innerHTML = '<div class="spinner"></div><span>Carregando...</span>'
    loading.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;color:white;"
    document.body.appendChild(loading)
    return loading
  }

  // Função para mostrar toast
  function showToast(message, type = "success") {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:4px;color:white;z-index:10000;${type === "success" ? "background:#28a745;" : "background:#dc3545;"}`
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  const fetchPessoas = async () => {
    try {
      console.log(" Iniciando busca de pessoas...")
      const response = await auth.authenticatedRequest("/api/pessoas")
      console.log(" Response status:", response.status)

      if (!response.ok) throw new Error("Falha ao buscar pessoas.")

      const result = await response.json()
      console.log(" Dados recebidos:", result)

      allPessoas = result.data || []
      console.log(" Total de pessoas carregadas:", allPessoas.length)

      populatePessoasSelect()
    } catch (error) {
      console.error(" Erro ao carregar pessoas:", error)
      showToast("Erro ao carregar pessoas: " + error.message, "error")
    }
  }

  const populatePessoasSelect = () => {
    console.log(" Populando select de pessoas...")
    const select = document.getElementById("usuarioNome")
    if (!select) {
      console.error(" Select usuarioNome não encontrado!")
      return
    }

    // Limpar opções existentes (exceto a primeira)
    select.innerHTML = '<option value="">Selecione uma pessoa</option>'

    const pessoasAtivas = allPessoas.filter((pessoa) => {
      // A API de pessoas retorna status como boolean (true/false)
      const isActive = pessoa.status === true || pessoa.status === 1
      console.log(` Pessoa ${pessoa.nome}: status=${pessoa.status}, incluir=${isActive}`)
      return isActive
    })

    console.log(" Pessoas ativas encontradas:", pessoasAtivas.length)

    // Adicionar pessoas ativas
    pessoasAtivas.forEach((pessoa) => {
      const option = document.createElement("option")
      const pessoaId = pessoa.pessoa_id || pessoa.id
      option.value = pessoaId
      option.textContent = pessoa.nome
      select.appendChild(option)
      console.log(` Adicionada pessoa: ${pessoa.nome} (ID: ${pessoaId})`)
    })

    console.log(" Select populado com", select.options.length - 1, "pessoas")
  }

  const fetchUsers = async () => {
    try {
      showLoading(true)
      const response = await auth.authenticatedRequest("/api/usuarios")
      if (!response.ok) throw new Error("Falha ao buscar usuários.")
      const result = await response.json()
      allUsers = result.data
      renderTable(allUsers)
    } catch (error) {
      console.error("Erro:", error)
      showToast("Erro ao carregar usuários: " + error.message, "error")
      tableBody.innerHTML = `<tr><td colspan="6">Erro ao carregar dados. Tente novamente.</td></tr>`
    } finally {
      showLoading(false)
    }
  }

  const renderTable = (users) => {
    tableBody.innerHTML = ""
    if (!users || users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum usuário encontrado.</td></tr>`
      return
    }

    users.forEach((user) => {
      const row = tableBody.insertRow()
      row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span class="user-role-badge role-${user.tipo}">${user.tipo}</span></td>
                <td>
                    <div class="action-buttons">
                        <span class="status-badge status-${user.ativo ? "ativo" : "inativo"}">${user.ativo ? "ATIVO" : "INATIVO"}</span>
                        <button class="btn-edit" data-id="${user.id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-toggle-status" data-id="${user.id}" title="${user.ativo ? "Inativar" : "Ativar"}">
                            <i class="fas fa-${user.ativo ? "eye-slash" : "eye"}"></i>
                        </button>
                    </div>
                </td>
            `
    })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const id = idInput.value
    const isEditing = !!id

    const userData = {
      pessoa_id: document.getElementById("usuarioNome").value, // Usando pessoa_id ao invés de nome
      email: document.getElementById("usuarioEmail").value,
      tipo_usuario: document.getElementById("usuarioTipo").value,
    }

    const senha = document.getElementById("usuarioSenha").value
    if (senha) {
      userData.senha = senha
    } else if (!isEditing) {
      showToast("A senha é obrigatória para novos usuários.", "error")
      return
    }

    const method = isEditing ? "PUT" : "POST"
    const endpoint = isEditing ? `/api/usuarios/${id}` : "/api/usuarios"

    try {
      showLoading(true)
      const response = await auth.authenticatedRequest(endpoint, { method, body: JSON.stringify(userData) })
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.details && Array.isArray(errorData.details)) {
          // Show all validation errors
          const errorMessages = errorData.details.join("\n")
          showDetailedError(errorMessages)
        } else {
          throw new Error(errorData.error || "Falha ao salvar usuário.")
        }
        return
      }

      showToast(`Usuário ${isEditing ? "atualizado" : "cadastrado"} com sucesso!`)
      window.closeUsuarioModal()
      fetchUsers()
    } catch (error) {
      showToast(`Erro: ${error.message}`, "error")
    } finally {
      showLoading(false)
    }
  }

  function showDetailedError(message) {
    const errorModal = document.createElement("div")
    errorModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `

    errorModal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="color: #dc3545; margin-bottom: 15px;"><i class="fas fa-exclamation-triangle"></i> Erro de Validação</h3>
        <div style="background: #f8f9fa; border-left: 4px solid #dc3545; padding: 12px; margin-bottom: 15px; white-space: pre-line; font-size: 14px; line-height: 1.4;">${message}</div>
        <button onclick="this.closest('div').parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; float: right;">Fechar</button>
        <div style="clear: both;"></div>
      </div>
    `

    document.body.appendChild(errorModal)

    // Remove modal when clicking outside
    errorModal.addEventListener("click", (e) => {
      if (e.target === errorModal) {
        errorModal.remove()
      }
    })
  }

  const clearForm = () => {
    form.reset()
    idInput.value = ""
    formTitle.textContent = "Novo Usuário"
    const select = document.getElementById("usuarioNome")
    if (select) {
      select.disabled = false
      console.log(` Campo nome completo reabilitado para novo usuário`)
    }
  }

  const fetchPessoaById = async (pessoaId) => {
    try {
      console.log(` Buscando pessoa específica com ID: ${pessoaId}`)
      const response = await auth.authenticatedRequest(`/api/pessoas/${pessoaId}`)
      console.log(" Response status:", response.status)

      if (!response.ok) throw new Error("Falha ao buscar pessoa.")

      const result = await response.json()
      console.log(" Pessoa encontrada:", result)

      return result.data || result
    } catch (error) {
      console.error(" Erro ao carregar pessoa:", error)
      showToast("Erro ao carregar dados da pessoa: " + error.message, "error")
      return null
    }
  }

  const populatePessoasSelectForEdit = (pessoa, selectedPessoaId) => {
    console.log(" Populando select para edição com pessoa específica...")
    const select = document.getElementById("usuarioNome")
    if (!select) {
      console.error(" Select usuarioNome não encontrado!")
      return
    }

    select.innerHTML = '<option value="">Selecione uma pessoa</option>'

    const pessoasAtivas = allPessoas.filter((pessoa) => {
      // A API de pessoas retorna status como boolean (true/false)
      const isActive = pessoa.status === true || pessoa.status === 1
      return isActive
    })

    pessoasAtivas.forEach((pessoa) => {
      const option = document.createElement("option")
      const pessoaId = pessoa.pessoa_id || pessoa.id
      option.value = pessoaId
      option.textContent = pessoa.nome

      if (pessoaId == selectedPessoaId) {
        option.selected = true
        console.log(` Pessoa selecionada: ${pessoa.nome} (ID: ${pessoaId})`)
      }

      select.appendChild(option)
    })

    console.log(` Select populado com pessoa selecionada: ID ${selectedPessoaId}`)
  }

  const editUser = async (id) => {
    const user = allUsers.find((u) => u.id === id)
    if (!user) return

    console.log(` Editando usuário:`, user)

    await fetchPessoas()

    await new Promise((resolve) => setTimeout(resolve, 100))

    idInput.value = user.id
    document.getElementById("usuarioEmail").value = user.email
    document.getElementById("usuarioTipo").value = user.tipo
    document.getElementById("usuarioStatus").value = user.ativo ? "ativo" : "inativo"

    formTitle.textContent = "Editar Usuário"

    const select = document.getElementById("usuarioNome")
    if (select && user.pessoa_id) {
      select.value = user.pessoa_id
      select.disabled = true
      console.log(` Campo nome completo definido para pessoa_id: ${user.pessoa_id}`)
      console.log(` Valor selecionado no select:`, select.options[select.selectedIndex]?.text)
    }

    modal.style.display = "block"
  }

  const toggleStatus = async (id) => {
    const user = allUsers.find((u) => u.id === id)
    if (!user) return

    const action = user.ativo ? "inativar" : "ativar"
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return

    try {
      showLoading(true)
      const response = await auth.authenticatedRequest(`/api/usuarios/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error(`Falha ao ${action} o usuário.`)

      showToast(`Usuário ${action}do com sucesso!`)
      fetchUsers()
    } catch (error) {
      showToast(error.message, "error")
    } finally {
      showLoading(false)
    }
  }

  window.showAddUsuarioModal = () => {
    clearForm()
    console.log(" Abrindo modal e carregando pessoas...")
    fetchPessoas() // Garantindo que pessoas sejam carregadas ao abrir modal
    modal.style.display = "block"
    const select = document.getElementById("usuarioNome")
    if (select) {
      select.disabled = false
      console.log(` Campo nome completo habilitado para novo usuário`)
    }
  }

  window.closeUsuarioModal = () => {
    modal.style.display = "none"
    clearForm()
  }

  window.saveUsuarioForm = handleFormSubmit

  window.searchUsuarios = () => {
    const searchTerm = document.getElementById("searchUsuario").value.toLowerCase()
    const filteredUsers = allUsers.filter(
      (user) => user.nome.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
    )
    renderTable(filteredUsers)
  }

  // Event Listeners
  form.addEventListener("submit", handleFormSubmit)
  tableBody.addEventListener("click", (e) => {
    const editButton = e.target.closest(".btn-edit")
    const toggleButton = e.target.closest(".btn-toggle-status") // Updated class name to match new button
    if (editButton) {
      editUser(Number(editButton.dataset.id))
    }
    if (toggleButton) {
      toggleStatus(Number(toggleButton.dataset.id))
    }
  })

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      window.closeUsuarioModal()
    }
  })

  fetchUsers()
})
