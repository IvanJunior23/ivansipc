// frontend/assets/js/usuarios.js
document.addEventListener("DOMContentLoaded", () => {
  const auth = window.auth
  if (typeof auth === "undefined" || !auth.isAuthenticated()) return

  let allUsers = []
  const form = document.getElementById("usuarioForm")
  const tableBody = document.getElementById("usuariosTableBody")
  const formTitle = document.getElementById("usuarioModalTitle")
  const modal = document.getElementById("usuarioModal")
  const idInput = document.getElementById("usuarioId")
  let isSubmitting = false // Adicionando flag para prevenir duplo submit

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
                <td>${user.usuario_id}</td>
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span class="user-role-badge role-${user.tipo_usuario}">${user.tipo_usuario}</span></td>
                <td>
                    <div class="action-buttons">
                        <span class="status-badge status-${user.status ? "ativo" : "inativo"}">${user.status ? "ATIVO" : "INATIVO"}</span>
                        <button class="btn-edit" data-id="${user.usuario_id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-toggle-status" data-id="${user.usuario_id}" title="${user.status ? "Inativar" : "Ativar"}">
                            <i class="fas fa-${user.status ? "eye-slash" : "eye"}"></i>
                        </button>
                    </div>
                </td>
            `
    })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) {
      console.log(" Já está enviando, ignorando submit duplicado")
      return
    }

    const saveBtn = document.getElementById("saveUsuarioBtn")
    const id = idInput.value
    const isEditing = !!id

    const senha = document.getElementById("usuarioSenha").value
    const confirmarSenha = document.getElementById("usuarioConfirmarSenha").value

    if (senha && senha !== confirmarSenha) {
      showToast("As senhas não coincidem.", "error")
      return
    }

    if (!isEditing && !senha) {
      showToast("A senha é obrigatória para novos usuários.", "error")
      return
    }

    const formData = new FormData(form)

    const userData = {
      nome: formData.get("nome")?.trim(),
      telefone: formData.get("telefone")?.trim(),
      email: formData.get("email")?.trim(),
      tipo_usuario: formData.get("tipo_usuario"),
      endereco: {
        logradouro: formData.get("logradouro")?.trim(),
        numero: formData.get("numero")?.trim(),
        complemento: formData.get("complemento")?.trim(),
        bairro: formData.get("bairro")?.trim(),
        cidade: formData.get("cidade")?.trim(),
        estado: formData.get("estado"),
        cep: formData.get("cep")?.trim(),
      },
    }

    if (senha) {
      userData.senha = senha
    }

    console.log(" Dados do usuário a serem enviados:", userData)

    const method = isEditing ? "PUT" : "POST"
    const endpoint = isEditing ? `/api/usuarios/${id}` : "/api/usuarios"

    try {
      isSubmitting = true
      saveBtn.disabled = true
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'
      showLoading(true)

      const response = await auth.authenticatedRequest(endpoint, {
        method,
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.details && Array.isArray(errorData.details)) {
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
      isSubmitting = false
      saveBtn.disabled = false
      saveBtn.innerHTML = "Salvar"
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
    document.getElementById("usuarioSenha").required = true
  }

  const editUser = async (id) => {
    const user = allUsers.find((u) => u.usuario_id === id)
    if (!user) return

    console.log(" Editando usuário:", user)

    idInput.value = user.usuario_id
    formTitle.textContent = "Editar Usuário"

    document.getElementById("usuarioNome").value = user.nome || ""
    document.getElementById("usuarioTelefone").value = user.telefone || ""
    document.getElementById("usuarioEmail").value = user.email || ""
    document.getElementById("usuarioTipo").value = user.tipo_usuario || ""

    document.getElementById("usuarioLogradouro").value = user.logradouro || ""
    document.getElementById("usuarioNumero").value = user.numero || ""
    document.getElementById("usuarioComplemento").value = user.complemento || ""
    document.getElementById("usuarioBairro").value = user.bairro || ""
    document.getElementById("usuarioCidade").value = user.cidade || ""
    document.getElementById("usuarioEstado").value = user.estado || ""
    document.getElementById("usuarioCep").value = user.cep || ""

    document.getElementById("usuarioSenha").required = false
    document.getElementById("usuarioSenha").value = ""
    document.getElementById("usuarioConfirmarSenha").value = ""

    modal.style.display = "block"
  }

  const toggleStatus = async (id) => {
    const user = allUsers.find((u) => u.usuario_id === id)
    if (!user) return

    const novoStatus = !user.status
    const action = novoStatus ? "ativar" : "inativar"

    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return

    try {
      showLoading(true)
      const response = await auth.authenticatedRequest(`/api/usuarios/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: novoStatus }),
      })

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
    modal.style.display = "block"
  }

  window.closeUsuarioModal = () => {
    modal.style.display = "none"
    clearForm()
  }

  window.saveUsuarioForm = handleFormSubmit

  window.searchUsuarios = () => {
    const searchTerm = document.getElementById("searchUsuario").value.toLowerCase()
    const statusFilter = document.getElementById("filterStatus").value

    let filteredUsers = allUsers.filter(
      (user) => user.nome.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
    )

    if (statusFilter !== "todos") {
      const statusBool = statusFilter === "ativo"
      filteredUsers = filteredUsers.filter((user) => {
        const userStatus = user.status === 1 || user.status === true
        return userStatus === statusBool
      })
    }

    renderTable(filteredUsers)
  }

  window.filterUsuarios = () => {
    const statusFilter = document.getElementById("filterStatus").value
    const searchTerm = document.getElementById("searchUsuario").value.toLowerCase()

    console.log(" Filtrando usuários - Status:", statusFilter)

    let filteredUsers = allUsers

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(
        (user) => user.nome.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
      )
    }

    if (statusFilter !== "todos") {
      const statusBool = statusFilter === "ativo"
      filteredUsers = filteredUsers.filter((user) => {
        const userStatus = user.status === 1 || user.status === true
        console.log(
          " Usuário:",
          user.nome,
          "Status:",
          user.status,
          "Convertido:",
          userStatus,
          "Filtro:",
          statusBool,
        )
        return userStatus === statusBool
      })
    }

    console.log(" Total de usuários após filtro:", filteredUsers.length)
    renderTable(filteredUsers)
  }

  // Event Listeners
  form.addEventListener("submit", handleFormSubmit)
  tableBody.addEventListener("click", (e) => {
    const editButton = e.target.closest(".btn-edit")
    const toggleButton = e.target.closest(".btn-toggle-status")
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
