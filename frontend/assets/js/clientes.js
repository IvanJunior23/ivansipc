// Clientes Management JavaScript
let clientes = []
let editingClienteId = null

// Declare necessary functions
function checkAuth() {
  console.log("Checking authentication...")
}

function showLoading() {
  console.log("Loading...")
}

function getToken() {
  const token = localStorage.getItem("token")
  if (!token) {
    console.warn("Token não encontrado, redirecionando para login...")
    window.location.href = "/login.html"
    return null
  }

  // Validate token format
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
}

function hideLoading() {
  console.log("Loading hidden...")
}

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
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/clientes", {
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

    clientes = await response.json()
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

  clientes.forEach((cliente) => {
    const row = document.createElement("tr")
    const displayName = cliente.tipo_pessoa === "fisica" ? cliente.nome : cliente.razao_social
    const displayDoc = cliente.tipo_pessoa === "fisica" ? cliente.cpf : cliente.cnpj

    row.innerHTML = `
            <td>${cliente.id}</td>
            <td>
                <div class="customer-name" onclick="viewCliente(${cliente.id})">
                    ${displayName}
                    ${cliente.nome_fantasia ? `<small>${cliente.nome_fantasia}</small>` : ""}
                </div>
            </td>
            <td>${displayDoc || "-"}</td>
            <td>
                <span class="person-type-badge ${cliente.tipo_pessoa}">
                    ${cliente.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                </span>
            </td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone}</td>
            <td>
                <span class="status-badge ${cliente.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${cliente.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="viewCliente(${cliente.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editCliente(${cliente.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteCliente(${cliente.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Toggle person type fields
function togglePersonFields() {
  const tipoPessoa = document.getElementById("clienteTipoPessoa").value
  const fisicaFields = document.getElementById("pessoaFisicaFields")
  const juridicaFields = document.getElementById("pessoaJuridicaFields")

  if (tipoPessoa === "fisica") {
    fisicaFields.style.display = "block"
    juridicaFields.style.display = "none"
    // Make physical person fields required
    document.getElementById("clienteNome").required = true
    document.getElementById("clienteCpf").required = true
    document.getElementById("clienteRazaoSocial").required = false
    document.getElementById("clienteCnpj").required = false
  } else if (tipoPessoa === "juridica") {
    fisicaFields.style.display = "none"
    juridicaFields.style.display = "block"
    // Make legal person fields required
    document.getElementById("clienteNome").required = false
    document.getElementById("clienteCpf").required = false
    document.getElementById("clienteRazaoSocial").required = true
    document.getElementById("clienteCnpj").required = true
  } else {
    fisicaFields.style.display = "none"
    juridicaFields.style.display = "none"
  }
}

// Filter customers
function filterClientes() {
  const tipoPessoaFilter = document.getElementById("filterTipoPessoa").value
  const statusFilter = document.getElementById("filterStatus").value

  let filteredClientes = clientes

  if (tipoPessoaFilter) {
    filteredClientes = filteredClientes.filter((cliente) => cliente.tipo_pessoa === tipoPessoaFilter)
  }

  if (statusFilter) {
    filteredClientes = filteredClientes.filter((cliente) => cliente.status === statusFilter)
  }

  renderFilteredClientesTable(filteredClientes)
}

// Search customers
function searchClientes() {
  const searchTerm = document.getElementById("searchCliente").value.toLowerCase()
  const filteredClientes = clientes.filter(
    (cliente) =>
      (cliente.nome && cliente.nome.toLowerCase().includes(searchTerm)) ||
      (cliente.razao_social && cliente.razao_social.toLowerCase().includes(searchTerm)) ||
      (cliente.cpf && cliente.cpf.includes(searchTerm)) ||
      (cliente.cnpj && cliente.cnpj.includes(searchTerm)) ||
      cliente.email.toLowerCase().includes(searchTerm),
  )

  renderFilteredClientesTable(filteredClientes)
}

// Render filtered customers table
function renderFilteredClientesTable(filteredClientes) {
  const tbody = document.getElementById("clientesTableBody")
  tbody.innerHTML = ""

  filteredClientes.forEach((cliente) => {
    const row = document.createElement("tr")
    const displayName = cliente.tipo_pessoa === "fisica" ? cliente.nome : cliente.razao_social
    const displayDoc = cliente.tipo_pessoa === "fisica" ? cliente.cpf : cliente.cnpj

    row.innerHTML = `
            <td>${cliente.id}</td>
            <td>
                <div class="customer-name" onclick="viewCliente(${cliente.id})">
                    ${displayName}
                    ${cliente.nome_fantasia ? `<small>${cliente.nome_fantasia}</small>` : ""}
                </div>
            </td>
            <td>${displayDoc || "-"}</td>
            <td>
                <span class="person-type-badge ${cliente.tipo_pessoa}">
                    ${cliente.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                </span>
            </td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone}</td>
            <td>
                <span class="status-badge ${cliente.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${cliente.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="viewCliente(${cliente.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editCliente(${cliente.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteCliente(${cliente.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
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
  document.getElementById("pessoaFisicaFields").style.display = "none"
  document.getElementById("pessoaJuridicaFields").style.display = "none"
  document.getElementById("clienteModal").style.display = "block"
}

// View customer details
async function viewCliente(id) {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

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

    const cliente = await response.json()
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
  const displayName = cliente.tipo_pessoa === "fisica" ? cliente.nome : cliente.razao_social
  const displayDoc = cliente.tipo_pessoa === "fisica" ? cliente.cpf : cliente.cnpj

  detailsContainer.innerHTML = `
        <div class="customer-details">
            <div class="customer-info">
                <h3>${displayName}</h3>
                <p><strong>Tipo:</strong> ${cliente.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                <p><strong>${cliente.tipo_pessoa === "fisica" ? "CPF" : "CNPJ"}:</strong> ${displayDoc || "Não informado"}</p>
                ${cliente.tipo_pessoa === "fisica" && cliente.rg ? `<p><strong>RG:</strong> ${cliente.rg}</p>` : ""}
                ${cliente.tipo_pessoa === "fisica" && cliente.data_nascimento ? `<p><strong>Data de Nascimento:</strong> ${new Date(cliente.data_nascimento).toLocaleDateString("pt-BR")}</p>` : ""}
                ${cliente.tipo_pessoa === "juridica" && cliente.nome_fantasia ? `<p><strong>Nome Fantasia:</strong> ${cliente.nome_fantasia}</p>` : ""}
                ${cliente.tipo_pessoa === "juridica" && cliente.inscricao_estadual ? `<p><strong>Inscrição Estadual:</strong> ${cliente.inscricao_estadual}</p>` : ""}
                <p><strong>Email:</strong> ${cliente.email}</p>
                <p><strong>Telefone:</strong> ${cliente.telefone}</p>
                <p><strong>Observações:</strong> ${cliente.observacoes || "Nenhuma observação"}</p>
                <p><strong>Status:</strong> <span class="status-badge ${cliente.status === "ativo" ? "status-active" : "status-inactive"}">${cliente.status}</span></p>
            </div>
        </div>
    `
}

// Edit customer
function editCliente(id) {
  const cliente = clientes.find((c) => c.id === id)
  if (!cliente) return

  editingClienteId = id
  document.getElementById("clienteModalTitle").textContent = "Editar Cliente"
  document.getElementById("clienteId").value = cliente.id
  document.getElementById("clienteTipoPessoa").value = cliente.tipo_pessoa

  togglePersonFields()

  if (cliente.tipo_pessoa === "fisica") {
    document.getElementById("clienteNome").value = cliente.nome || ""
    document.getElementById("clienteCpf").value = cliente.cpf || ""
    document.getElementById("clienteRg").value = cliente.rg || ""
    document.getElementById("clienteDataNascimento").value = cliente.data_nascimento || ""
  } else {
    document.getElementById("clienteRazaoSocial").value = cliente.razao_social || ""
    document.getElementById("clienteCnpj").value = cliente.cnpj || ""
    document.getElementById("clienteNomeFantasia").value = cliente.nome_fantasia || ""
    document.getElementById("clienteInscricaoEstadual").value = cliente.inscricao_estadual || ""
  }

  document.getElementById("clienteEmail").value = cliente.email
  document.getElementById("clienteTelefone").value = cliente.telefone
  document.getElementById("clienteObservacoes").value = cliente.observacoes || ""
  document.getElementById("clienteStatus").value = cliente.status
  document.getElementById("clienteModal").style.display = "block"
}

// Save customer form
async function saveClienteForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const clienteData = {}

  for (const [key, value] of formData.entries()) {
    clienteData[key] = typeof value === "string" ? value.trim() : value
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

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

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("Token expirado ou inválido, redirecionando para login...")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      throw new Error(result.message || "Erro ao salvar cliente")
    }

    showToast(editingClienteId ? "Cliente atualizado com sucesso!" : "Cliente criado com sucesso!", "success")
    closeClienteModal()
    loadClientes()
  } catch (error) {
    showToast("Erro ao salvar cliente: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Delete customer
async function deleteCliente(id) {
  if (!confirm("Tem certeza que deseja excluir este cliente?")) return

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch(`/api/clientes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const result = await response.json()

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("Token expirado ou inválido, redirecionando para login...")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      throw new Error(result.message || "Erro ao excluir cliente")
    }

    showToast("Cliente excluído com sucesso!", "success")
    loadClientes()
  } catch (error) {
    showToast("Erro ao excluir cliente: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Export customers
function exportClientes() {
  showToast("Funcionalidade de exportação em desenvolvimento", "info")
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
