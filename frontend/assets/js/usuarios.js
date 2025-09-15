// frontend/assets/js/usuarios.js
document.addEventListener("DOMContentLoaded", () => {
  const auth = window.auth // Declare the auth variable here
  if (typeof auth === "undefined" || !auth.isAuthenticated()) return

  let allUsers = []
  const form = document.getElementById("form-usuario")
  const tableBody = document.getElementById("usuarios-table-body")
  const formTitle = document.getElementById("form-title")
  const btnSalvar = document.getElementById("btn-salvar")
  const senhaDesc = document.getElementById("senha-desc")
  const idInput = document.getElementById("usuario-id")

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
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum usuário encontrado.</td></tr>`
      return
    }

    users.forEach((user) => {
      const row = tableBody.insertRow()
      row.innerHTML = `
                <td>${user.usuario_id}</td>
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span class="user-role-badge role-${user.tipo_usuario}">${user.tipo_usuario}</span></td>
                <td><span class="status-badge status-${user.status ? "ativo" : "inativo"}">${user.status ? "Ativo" : "Inativo"}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" data-id="${user.usuario_id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-toggle" data-id="${user.usuario_id}" title="${user.status ? "Inativar" : "Ativar"}">
                            <i class="fas fa-${user.status ? "toggle-off" : "toggle-on"}"></i>
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
      nome: document.getElementById("nome").value,
      email: document.getElementById("email").value,
      tipo_usuario: document.getElementById("tipo_usuario").value,
    }

    const senha = document.getElementById("senha").value
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
        throw new Error(errorData.error || "Falha ao salvar usuário.")
      }

      showToast(`Usuário ${isEditing ? "atualizado" : "cadastrado"} com sucesso!`)
      clearForm()
      fetchUsers()
    } catch (error) {
      showToast(`Erro: ${error.message}`, "error")
    } finally {
      showLoading(false)
    }
  }

  const clearForm = () => {
    form.reset()
    idInput.value = ""
    formTitle.textContent = "Cadastro de Usuário"
    btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar'
    senhaDesc.textContent = "Mínimo 6 caracteres. Obrigatória para novos usuários."
  }

  const editUser = (id) => {
    const user = allUsers.find((u) => u.usuario_id === id)
    if (!user) return

    idInput.value = user.usuario_id
    document.getElementById("nome").value = user.nome
    document.getElementById("email").value = user.email
    document.getElementById("tipo_usuario").value = user.tipo_usuario

    formTitle.textContent = "Editando Usuário"
    btnSalvar.innerHTML = '<i class="fas fa-save"></i> Atualizar'
    senhaDesc.textContent = "Deixe em branco para não alterar a senha."
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleStatus = async (id) => {
    const user = allUsers.find((u) => u.usuario_id === id)
    if (!user) return

    const action = user.status ? "inativar" : "ativar"
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

  // Event Listeners
  form.addEventListener("submit", handleFormSubmit)
  document.getElementById("btn-limpar").addEventListener("click", clearForm)
  tableBody.addEventListener("click", (e) => {
    const editButton = e.target.closest(".btn-edit")
    const toggleButton = e.target.closest(".btn-toggle")
    if (editButton) {
      editUser(Number(editButton.dataset.id))
    }
    if (toggleButton) {
      toggleStatus(Number(toggleButton.dataset.id))
    }
  })

  fetchUsers()
})
