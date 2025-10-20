// Clientes Management JavaScript
let clientes = []
let editingClienteId = null
let pessoas = []

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadPessoas()
  loadClientes()
})

async function loadPessoas() {
  try {
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/pessoas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar pessoas")
    }

    const result = await response.json()
    pessoas = result.data || result
    console.log(" Pessoas carregadas:", pessoas)
  } catch (error) {
    showToast("Erro ao carregar pessoas: " + error.message, "error")
  }
}

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
    console.log(
      " Clientes (ativos e inativos):",
      clientes.map((c) => ({
        id: c.cliente_id,
        nome: c.nome,
        status: c.status ? "ATIVO" : "INATIVO",
      })),
    )
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
    const statusBool = statusFilter === "ativo"
    filteredClientes = filteredClientes.filter((cliente) => cliente.status === statusBool)
  }

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

// Show add customer modal
function showAddClienteModal() {
  editingClienteId = null
  document.getElementById("clienteModalTitle").textContent = "Novo Cliente"
  document.getElementById("clienteForm").reset()
  document.getElementById("clienteId").value = ""
  document.getElementById("pessoaInfo").style.display = "none"

  // Carregar pessoas no select
  const pessoaSelect = document.getElementById("clientePessoa")
  pessoaSelect.innerHTML = '<option value="">Selecione uma pessoa</option>'
  pessoas.forEach((pessoa) => {
    const option = document.createElement("option")
    option.value = pessoa.pessoa_id
    option.textContent = `${pessoa.nome} (ID: ${pessoa.pessoa_id})`
    pessoaSelect.appendChild(option)
  })

  document.getElementById("clienteModal").style.display = "block"
}

// View customer details
async function viewCliente(id) {
  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch(`/api/clientes/${id}`, {
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
      throw new Error("Erro ao carregar detalhes do cliente")
    }

    const result = await response.json()
    const cliente = result.data || result
    renderClienteDetails(cliente)
    document.getElementById("viewClienteModal").style.display = "block"
  } catch (error) {
    showToast("Erro ao carregar detalhes: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render customer details
function renderClienteDetails(cliente) {
  const detailsContainer = document.getElementById("clienteDetails")

  let enderecoCompleto = "-"
  if (cliente.logradouro) {
    enderecoCompleto = `${cliente.logradouro}, ${cliente.numero || "S/N"}`
    if (cliente.complemento) enderecoCompleto += ` - ${cliente.complemento}`
    if (cliente.bairro) enderecoCompleto += ` - ${cliente.bairro}`
    if (cliente.cidade && cliente.estado) enderecoCompleto += ` - ${cliente.cidade}/${cliente.estado}`
    if (cliente.cep) enderecoCompleto += ` - CEP: ${cliente.cep}`
  }

  detailsContainer.innerHTML = `
    <div class="customer-details">
      <div class="customer-info">
        <h3>${cliente.nome || "Sem nome"}</h3>
        <p><strong>CPF:</strong> ${cliente.cpf || "Não informado"}</p>
        <p><strong>Email:</strong> ${cliente.email || "Não informado"}</p>
        <p><strong>Telefone:</strong> ${cliente.telefone || "Não informado"}</p>
        <p><strong>Endereço:</strong> ${enderecoCompleto}</p>
        <p><strong>Status:</strong> <span class="status-badge ${cliente.status ? "status-ativo" : "status-inativo"}">${cliente.status ? "Ativo" : "Inativo"}</span></p>
      </div>
    </div>
  `
}

// Edit customer
function editCliente(id) {
  const cliente = clientes.find((c) => c.cliente_id === id)
  if (!cliente) return

  editingClienteId = id
  document.getElementById("clienteModalTitle").textContent = "Editar Cliente"
  document.getElementById("clienteId").value = cliente.cliente_id

  // Carregar pessoas no select
  const pessoaSelect = document.getElementById("clientePessoa")
  pessoaSelect.innerHTML = '<option value="">Selecione uma pessoa</option>'
  pessoas.forEach((pessoa) => {
    const option = document.createElement("option")
    option.value = pessoa.pessoa_id
    option.textContent = `${pessoa.nome} (ID: ${pessoa.pessoa_id})`
    if (pessoa.pessoa_id === cliente.pessoa_id) {
      option.selected = true
    }
    pessoaSelect.appendChild(option)
  })

  // Desabilitar select de pessoa durante edição
  pessoaSelect.disabled = true

  document.getElementById("clienteCpf").value = cliente.cpf || ""

  // Mostrar dados da pessoa
  onPessoaSelected()

  document.getElementById("clienteModal").style.display = "block"
}

// Save customer form
async function saveClienteForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const pessoaId = Number.parseInt(formData.get("pessoa_id"))
  const cpf = formData.get("cpf")

  // Validação
  if (!pessoaId || isNaN(pessoaId) || pessoaId <= 0) {
    showToast("Por favor, selecione uma pessoa válida", "error")
    return
  }

  if (!cpf || cpf.trim() === "") {
    showToast("Por favor, informe o CPF", "error")
    return
  }

  const clienteData = {
    pessoa_id: pessoaId,
    cpf: cpf,
  }

  console.log(" Dados do cliente a salvar:", clienteData)

  try {
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
    console.log(" Resposta da API:", result)

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
    console.error(" Erro ao salvar cliente:", error)
    showToast("Erro ao salvar cliente: " + error.message, "error")
  } finally {
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
  document.getElementById("clientePessoa").disabled = false
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
  // Implementar toast notification aqui
}

function showLoading() {
  console.log("Loading...")
  // Implementar loading indicator aqui
}

function hideLoading() {
  console.log("Loading hidden...")
  // Implementar hide loading aqui
}

function onPessoaSelected() {
  const pessoaId = document.getElementById("clientePessoa").value

  if (!pessoaId) {
    document.getElementById("pessoaInfo").style.display = "none"
    return
  }

  const pessoa = pessoas.find((p) => p.pessoa_id === Number.parseInt(pessoaId))

  if (pessoa) {
    document.getElementById("pessoaNome").textContent = pessoa.nome || "-"
    document.getElementById("pessoaInfo").style.display = "block"
  }
}

// Confirm action global function
function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} este ${item}?`
  if (confirm(message)) {
    callback()
  }
}
