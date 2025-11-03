// Clientes Management JavaScript
let clientes = []
let editingClienteId = null

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadClientes()
})

// Load customers from API
async function loadClientes() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/clientes?incluir_inativos=true", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("Token expirado ou inválido, redirecionando para login...")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      throw new Error("Erro ao carregar clientes")
    }

    const result = await response.json()
    clientes = result.data || result
    console.log(" Total de clientes carregados:", clientes.length)
    renderClientesTable()
  } catch (error) {
    showToast("Erro ao carregar clientes: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render customers table
function renderClientesTable() {
  const tbody = document.getElementById("clientesTableBody")
  tbody.innerHTML = ""

  if (!clientes || clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum cliente encontrado</td></tr>'
    return
  }

  clientes.forEach((cliente) => {
    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${cliente.cliente_id}</td>
      <td>${cliente.nome || "Sem nome"}</td>
      <td>${cliente.cpf || "-"}</td>
      <td>
        <span class="status-badge ${cliente.status ? "status-ativo" : "status-inativo"}">
          ${cliente.status ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-sm btn-edit" onclick="editCliente(${cliente.cliente_id})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-sm ${cliente.status ? "btn-delete" : "btn-view"}" 
                  onclick="confirmAction('${cliente.status ? "desativar" : "ativar"}', 'cliente', function() { performToggleStatus(${cliente.cliente_id}, ${!cliente.status}); })" 
                  title="${cliente.status ? "Desativar" : "Ativar"} cliente">
            <i class="fas ${cliente.status ? "fa-toggle-on" : "fa-toggle-off"}"></i>
          </button>
        </div>
      </td>
    `
    tbody.appendChild(row)
  })
}

// Search customers
function searchClientes() {
  const searchTerm = document.getElementById("searchCliente").value.toLowerCase()
  const filteredClientes = clientes.filter(
    (cliente) =>
      (cliente.nome && cliente.nome.toLowerCase().includes(searchTerm)) ||
      (cliente.cpf && cliente.cpf.includes(searchTerm)),
  )

  renderFilteredClientesTable(filteredClientes)
}

// Filter customers by status
function filterClientes() {
  const statusFilter = document.getElementById("filterStatus").value

  let filteredClientes = clientes

  if (statusFilter) {
    filteredClientes = filteredClientes.filter((cliente) => {
      // Converte o status do cliente para booleano se for número
      const clienteStatus = typeof cliente.status === "number" ? cliente.status === 1 : Boolean(cliente.status)
      const filterStatus = statusFilter === "ativo"

      console.log(
        ` Filtrando cliente ${cliente.cliente_id}: status=${cliente.status} (${typeof cliente.status}), clienteStatus=${clienteStatus}, filterStatus=${filterStatus}`,
      )

      return clienteStatus === filterStatus
    })
  }

  console.log(` Total de clientes após filtro: ${filteredClientes.length}`)
  renderFilteredClientesTable(filteredClientes)
}

// Render filtered customers table
function renderFilteredClientesTable(filteredClientes) {
  const tbody = document.getElementById("clientesTableBody")
  tbody.innerHTML = ""

  if (!filteredClientes || filteredClientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum cliente encontrado</td></tr>'
    return
  }

  filteredClientes.forEach((cliente) => {
    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${cliente.cliente_id}</td>
      <td>${cliente.nome || "Sem nome"}</td>
      <td>${cliente.cpf || "-"}</td>
      <td>
        <span class="status-badge ${cliente.status ? "status-ativo" : "status-inativo"}">
          ${cliente.status ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-sm btn-edit" onclick="editCliente(${cliente.cliente_id})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-sm ${cliente.status ? "btn-delete" : "btn-view"}" 
                  onclick="confirmAction('${cliente.status ? "desativar" : "ativar"}', 'cliente', function() { performToggleStatus(${cliente.cliente_id}, ${!cliente.status}); })" 
                  title="${cliente.status ? "Desativar" : "Ativar"} cliente">
            <i class="fas ${cliente.status ? "fa-toggle-on" : "fa-toggle-off"}"></i>
          </button>
        </div>
      </td>
    `
    tbody.appendChild(row)
  })
}

function showAddClienteModal() {
  editingClienteId = null
  document.getElementById("clienteModalTitle").textContent = "Novo Cliente"
  document.getElementById("clienteForm").reset()
  document.getElementById("clienteId").value = ""
  document.getElementById("clienteModal").style.display = "block"
}

function editCliente(id) {
  const cliente = clientes.find((c) => c.cliente_id === id)
  if (!cliente) return

  editingClienteId = id
  document.getElementById("clienteModalTitle").textContent = "Editar Cliente"
  document.getElementById("clienteId").value = cliente.cliente_id

  document.getElementById("clienteNome").value = cliente.nome || ""
  document.getElementById("clienteCpf").value = cliente.cpf || ""
  document.getElementById("clienteTelefone").value = cliente.telefone || ""
  document.getElementById("clienteEmail").value = cliente.email || ""
  document.getElementById("clienteLogradouro").value = cliente.logradouro || ""
  document.getElementById("clienteNumero").value = cliente.numero || ""
  document.getElementById("clienteComplemento").value = cliente.complemento || ""
  document.getElementById("clienteBairro").value = cliente.bairro || ""
  document.getElementById("clienteCidade").value = cliente.cidade || ""
  document.getElementById("clienteEstado").value = cliente.estado || ""
  document.getElementById("clienteCep").value = cliente.cep || ""

  document.getElementById("clienteModal").style.display = "block"
}

async function saveClienteForm(event) {
  event.preventDefault()

  const submitBtn = event.target.querySelector('button[type="submit"]')
  if (submitBtn.disabled) {
    console.log(" ⚠️ Formulário já está sendo enviado, ignorando submit duplicado")
    return
  }

  const formData = new FormData(event.target)

  const clienteData = {
    nome: formData.get("nome")?.trim(),
    cpf: formData.get("cpf")?.trim(),
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

  console.log(" 📝 Dados completos do cliente a salvar:", clienteData)

  // Validações básicas
  if (!clienteData.nome || !clienteData.cpf || !clienteData.telefone || !clienteData.email) {
    showToast("Por favor, preencha todos os campos obrigatórios de dados pessoais e contato", "error")
    return
  }

  if (
    !clienteData.endereco.logradouro ||
    !clienteData.endereco.numero ||
    !clienteData.endereco.bairro ||
    !clienteData.endereco.cidade ||
    !clienteData.endereco.estado ||
    !clienteData.endereco.cep
  ) {
    showToast("Por favor, preencha todos os campos obrigatórios de endereço", "error")
    return
  }

  try {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'

    showLoading()
    const token = getToken()
    if (!token) return

    const url = editingClienteId ? `/api/clientes/${editingClienteId}` : "/api/clientes"
    const method = editingClienteId ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clienteData),
    })

    const result = await response.json()
    console.log(" ✅ Resposta da API:", result)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("Token expirado ou inválido, redirecionando para login...")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      const errorMessage = result.details ? result.details.join(", ") : result.message || "Erro ao salvar cliente"
      throw new Error(errorMessage)
    }

    showToast(editingClienteId ? "Cliente atualizado com sucesso!" : "Cliente criado com sucesso!", "success")
    closeClienteModal()
    loadClientes()
  } catch (error) {
    console.error(" ❌ Erro ao salvar cliente:", error)
    showToast("Erro ao salvar cliente: " + error.message, "error")
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = "Salvar"
    hideLoading()
  }
}

// Toggle customer status
async function performToggleStatus(id, newStatus) {
  try {
    showLoading()
    console.log(" Alterando status do cliente ID:", id, "para:", newStatus)

    const token = getToken()
    if (!token) return

    const response = await fetch(`/api/clientes/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("Token expirado ou inválido, redirecionando para login...")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
      throw new Error(errorData.error || `Erro ${response.status}`)
    }

    const result = await response.json()
    console.log(" Status alterado com sucesso:", result)

    const statusText = newStatus ? "ativado" : "inativado"
    showToast(`Cliente ${statusText} com sucesso!`, "success")

    setTimeout(() => {
      loadClientes()
    }, 500)
  } catch (error) {
    console.error(" Erro ao alterar status:", error)
    showToast(error.message || "Erro ao alterar status do cliente", "error")
  } finally {
    hideLoading()
  }
}

// Close customer modal
function closeClienteModal() {
  document.getElementById("clienteModal").style.display = "none"
  editingClienteId = null
}

// Close view customer modal
function closeViewClienteModal() {
  document.getElementById("viewClienteModal").style.display = "none"
}

// Close modal when clicking outside
window.onclick = (event) => {
  const clienteModal = document.getElementById("clienteModal")
  const viewModal = document.getElementById("viewClienteModal")

  if (event.target === clienteModal) {
    closeClienteModal()
  }
  if (event.target === viewModal) {
    closeViewClienteModal()
  }
}

// Utility functions
function checkAuth() {
  const token = localStorage.getItem("token")
  if (!token) {
    window.location.href = "/login.html"
  }
}

function getToken() {
  const token = localStorage.getItem("token")
  if (!token) {
    console.warn("Token não encontrado, redirecionando para login...")
    window.location.href = "/login.html"
    return null
  }

  if (!isValidJWTFormat(token)) {
    console.warn("Token inválido encontrado, limpando e redirecionando...")
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
    return null
  }

  return token.trim()
}

function isValidJWTFormat(token) {
  if (!token || typeof token !== "string") return false

  const parts = token.trim().split(".")
  if (parts.length !== 3) return false

  try {
    parts.forEach((part) => {
      if (!part || part.length === 0) throw new Error("Empty part")
      atob(part.replace(/-/g, "+").replace(/_/g, "/"))
    })
    return true
  } catch (error) {
    return false
  }
}

function showToast(message, type) {
  console.log(`Toast: ${message} (${type})`)
  alert(message)
}

function showLoading() {
  console.log("Loading...")
}

function hideLoading() {
  console.log("Loading hidden...")
}

// Confirm action global function
function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} este ${item}?`
  if (confirm(message)) {
    callback()
  }
}
