// Fornecedores Management JavaScript
let fornecedores = []
let editingFornecedorId = null

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
  loadFornecedores()
})

// Load suppliers from API
async function loadFornecedores() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/fornecedores", {
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
      throw new Error("Erro ao carregar fornecedores")
    }

    fornecedores = await response.json()
    renderFornecedoresTable()
  } catch (error) {
    showToast("Erro ao carregar fornecedores: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render suppliers table
function renderFornecedoresTable() {
  const tbody = document.getElementById("fornecedoresTableBody")
  tbody.innerHTML = ""

  fornecedores.forEach((fornecedor) => {
    const row = document.createElement("tr")
    const displayName = fornecedor.tipo_pessoa === "fisica" ? fornecedor.nome : fornecedor.razao_social
    const displayDoc = fornecedor.tipo_pessoa === "fisica" ? fornecedor.cpf : fornecedor.cnpj

    row.innerHTML = `
            <td>${fornecedor.id}</td>
            <td>
                <div class="supplier-name" onclick="viewFornecedor(${fornecedor.id})">
                    ${displayName}
                    ${fornecedor.nome_fantasia ? `<small>${fornecedor.nome_fantasia}</small>` : ""}
                </div>
            </td>
            <td>${displayDoc || "-"}</td>
            <td>
                <span class="person-type-badge ${fornecedor.tipo_pessoa}">
                    ${fornecedor.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                </span>
            </td>
            <td>${fornecedor.email}</td>
            <td>${fornecedor.telefone}</td>
            <td>
                <span class="status-badge ${fornecedor.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${fornecedor.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="viewFornecedor(${fornecedor.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editFornecedor(${fornecedor.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteFornecedor(${fornecedor.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Toggle supplier person type fields
function toggleSupplierPersonFields() {
  const tipoPessoa = document.getElementById("fornecedorTipoPessoa").value
  const fisicaFields = document.getElementById("fornecedorPessoaFisicaFields")
  const juridicaFields = document.getElementById("fornecedorPessoaJuridicaFields")

  if (tipoPessoa === "fisica") {
    fisicaFields.style.display = "block"
    juridicaFields.style.display = "none"
    // Make physical person fields required
    document.getElementById("fornecedorNome").required = true
    document.getElementById("fornecedorCpf").required = true
    document.getElementById("fornecedorRazaoSocial").required = false
    document.getElementById("fornecedorCnpj").required = false
  } else if (tipoPessoa === "juridica") {
    fisicaFields.style.display = "none"
    juridicaFields.style.display = "block"
    // Make legal person fields required
    document.getElementById("fornecedorNome").required = false
    document.getElementById("fornecedorCpf").required = false
    document.getElementById("fornecedorRazaoSocial").required = true
    document.getElementById("fornecedorCnpj").required = true
  } else {
    fisicaFields.style.display = "none"
    juridicaFields.style.display = "none"
  }
}

// Filter suppliers
function filterFornecedores() {
  const tipoPessoaFilter = document.getElementById("filterTipoPessoa").value
  const statusFilter = document.getElementById("filterStatus").value

  let filteredFornecedores = fornecedores

  if (tipoPessoaFilter) {
    filteredFornecedores = filteredFornecedores.filter((fornecedor) => fornecedor.tipo_pessoa === tipoPessoaFilter)
  }

  if (statusFilter) {
    filteredFornecedores = filteredFornecedores.filter((fornecedor) => fornecedor.status === statusFilter)
  }

  renderFilteredFornecedoresTable(filteredFornecedores)
}

// Search suppliers
function searchFornecedores() {
  const searchTerm = document.getElementById("searchFornecedor").value.toLowerCase()
  const filteredFornecedores = fornecedores.filter(
    (fornecedor) =>
      (fornecedor.nome && fornecedor.nome.toLowerCase().includes(searchTerm)) ||
      (fornecedor.razao_social && fornecedor.razao_social.toLowerCase().includes(searchTerm)) ||
      (fornecedor.cpf && fornecedor.cpf.includes(searchTerm)) ||
      (fornecedor.cnpj && fornecedor.cnpj.includes(searchTerm)) ||
      fornecedor.email.toLowerCase().includes(searchTerm),
  )

  renderFilteredFornecedoresTable(filteredFornecedores)
}

// Render filtered suppliers table
function renderFilteredFornecedoresTable(filteredFornecedores) {
  const tbody = document.getElementById("fornecedoresTableBody")
  tbody.innerHTML = ""

  filteredFornecedores.forEach((fornecedor) => {
    const row = document.createElement("tr")
    const displayName = fornecedor.tipo_pessoa === "fisica" ? fornecedor.nome : fornecedor.razao_social
    const displayDoc = fornecedor.tipo_pessoa === "fisica" ? fornecedor.cpf : fornecedor.cnpj

    row.innerHTML = `
            <td>${fornecedor.id}</td>
            <td>
                <div class="supplier-name" onclick="viewFornecedor(${fornecedor.id})">
                    ${displayName}
                    ${fornecedor.nome_fantasia ? `<small>${fornecedor.nome_fantasia}</small>` : ""}
                </div>
            </td>
            <td>${displayDoc || "-"}</td>
            <td>
                <span class="person-type-badge ${fornecedor.tipo_pessoa}">
                    ${fornecedor.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                </span>
            </td>
            <td>${fornecedor.email}</td>
            <td>${fornecedor.telefone}</td>
            <td>
                <span class="status-badge ${fornecedor.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${fornecedor.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="viewFornecedor(${fornecedor.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editFornecedor(${fornecedor.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteFornecedor(${fornecedor.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Show add supplier modal
function showAddFornecedorModal() {
  editingFornecedorId = null
  document.getElementById("fornecedorModalTitle").textContent = "Novo Fornecedor"
  document.getElementById("fornecedorForm").reset()
  document.getElementById("fornecedorId").value = ""
  document.getElementById("fornecedorPessoaFisicaFields").style.display = "none"
  document.getElementById("fornecedorPessoaJuridicaFields").style.display = "none"
  document.getElementById("fornecedorModal").style.display = "block"
}

// View supplier details
async function viewFornecedor(id) {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch(`/api/fornecedores/${id}`, {
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
      throw new Error("Erro ao carregar detalhes do fornecedor")
    }

    const fornecedor = await response.json()
    renderFornecedorDetails(fornecedor)
    document.getElementById("viewFornecedorModal").style.display = "block"
  } catch (error) {
    showToast("Erro ao carregar detalhes: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render supplier details
function renderFornecedorDetails(fornecedor) {
  const detailsContainer = document.getElementById("fornecedorDetails")
  const displayName = fornecedor.tipo_pessoa === "fisica" ? fornecedor.nome : fornecedor.razao_social
  const displayDoc = fornecedor.tipo_pessoa === "fisica" ? fornecedor.cpf : fornecedor.cnpj

  detailsContainer.innerHTML = `
        <div class="supplier-details">
            <div class="supplier-info">
                <h3>${displayName}</h3>
                <p><strong>Tipo:</strong> ${fornecedor.tipo_pessoa === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                <p><strong>${fornecedor.tipo_pessoa === "fisica" ? "CPF" : "CNPJ"}:</strong> ${displayDoc || "Não informado"}</p>
                ${fornecedor.tipo_pessoa === "fisica" && fornecedor.rg ? `<p><strong>RG:</strong> ${fornecedor.rg}</p>` : ""}
                ${fornecedor.tipo_pessoa === "fisica" && fornecedor.data_nascimento ? `<p><strong>Data de Nascimento:</strong> ${new Date(fornecedor.data_nascimento).toLocaleDateString("pt-BR")}</p>` : ""}
                ${fornecedor.tipo_pessoa === "juridica" && fornecedor.nome_fantasia ? `<p><strong>Nome Fantasia:</strong> ${fornecedor.nome_fantasia}</p>` : ""}
                ${fornecedor.tipo_pessoa === "juridica" && fornecedor.inscricao_estadual ? `<p><strong>Inscrição Estadual:</strong> ${fornecedor.inscricao_estadual}</p>` : ""}
                <p><strong>Email:</strong> ${fornecedor.email}</p>
                <p><strong>Telefone:</strong> ${fornecedor.telefone}</p>
                <p><strong>Observações:</strong> ${fornecedor.observacoes || "Nenhuma observação"}</p>
                <p><strong>Status:</strong> <span class="status-badge ${fornecedor.status === "ativo" ? "status-active" : "status-inactive"}">${fornecedor.status}</span></p>
            </div>
        </div>
    `
}

// Edit supplier
function editFornecedor(id) {
  const fornecedor = fornecedores.find((f) => f.id === id)
  if (!fornecedor) return

  editingFornecedorId = id
  document.getElementById("fornecedorModalTitle").textContent = "Editar Fornecedor"
  document.getElementById("fornecedorId").value = fornecedor.id
  document.getElementById("fornecedorTipoPessoa").value = fornecedor.tipo_pessoa

  toggleSupplierPersonFields()

  if (fornecedor.tipo_pessoa === "fisica") {
    document.getElementById("fornecedorNome").value = fornecedor.nome || ""
    document.getElementById("fornecedorCpf").value = fornecedor.cpf || ""
    document.getElementById("fornecedorRg").value = fornecedor.rg || ""
    document.getElementById("fornecedorDataNascimento").value = fornecedor.data_nascimento || ""
  } else {
    document.getElementById("fornecedorRazaoSocial").value = fornecedor.razao_social || ""
    document.getElementById("fornecedorCnpj").value = fornecedor.cnpj || ""
    document.getElementById("fornecedorNomeFantasia").value = fornecedor.nome_fantasia || ""
    document.getElementById("fornecedorInscricaoEstadual").value = fornecedor.inscricao_estadual || ""
  }

  document.getElementById("fornecedorEmail").value = fornecedor.email
  document.getElementById("fornecedorTelefone").value = fornecedor.telefone
  document.getElementById("fornecedorObservacoes").value = fornecedor.observacoes || ""
  document.getElementById("fornecedorStatus").value = fornecedor.status
  document.getElementById("fornecedorModal").style.display = "block"
}

// Save supplier form
async function saveFornecedorForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const fornecedorData = {}

  for (const [key, value] of formData.entries()) {
    fornecedorData[key] = typeof value === "string" ? value.trim() : value
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const url = editingFornecedorId ? `/api/fornecedores/${editingFornecedorId}` : "/api/fornecedores"
    const method = editingFornecedorId ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fornecedorData),
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
      throw new Error(result.message || "Erro ao salvar fornecedor")
    }

    showToast(editingFornecedorId ? "Fornecedor atualizado com sucesso!" : "Fornecedor criado com sucesso!", "success")
    closeFornecedorModal()
    loadFornecedores()
  } catch (error) {
    showToast("Erro ao salvar fornecedor: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Delete supplier
async function deleteFornecedor(id) {
  if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch(`/api/fornecedores/${id}`, {
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
      throw new Error(result.message || "Erro ao excluir fornecedor")
    }

    showToast("Fornecedor excluído com sucesso!", "success")
    loadFornecedores()
  } catch (error) {
    showToast("Erro ao excluir fornecedor: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Export suppliers
function exportFornecedores() {
  showToast("Funcionalidade de exportação em desenvolvimento", "info")
}

// Close supplier modal
function closeFornecedorModal() {
  document.getElementById("fornecedorModal").style.display = "none"
  editingFornecedorId = null
}

// Close view supplier modal
function closeViewFornecedorModal() {
  document.getElementById("viewFornecedorModal").style.display = "none"
}

// Close modal when clicking outside
window.onclick = (event) => {
  const fornecedorModal = document.getElementById("fornecedorModal")
  const viewModal = document.getElementById("viewFornecedorModal")

  if (event.target === fornecedorModal) {
    closeFornecedorModal()
  }
  if (event.target === viewModal) {
    closeViewFornecedorModal()
  }
}
