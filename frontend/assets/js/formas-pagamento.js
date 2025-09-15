// Formas de Pagamento Management JavaScript
let formasPagamento = []
let editingFormaPagamentoId = null

// Declare necessary functions
function checkAuth() {
  // Placeholder for authentication check
  console.log("Checking authentication...")
}

function showLoading() {
  // Placeholder for showing loading indicator
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
  // Placeholder for showing toast message
  console.log(`Toast: ${message} (${type})`)
}

function hideLoading() {
  // Placeholder for hiding loading indicator
  console.log("Loading hidden.")
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadFormasPagamento()
})

// Load payment methods from API
async function loadFormasPagamento() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/formas-pagamento", {
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
      throw new Error("Erro ao carregar formas de pagamento")
    }

    formasPagamento = await response.json()
    renderFormasPagamentoTable()
  } catch (error) {
    showToast("Erro ao carregar formas de pagamento: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render payment methods table
function renderFormasPagamentoTable() {
  const tbody = document.getElementById("formasPagamentoTableBody")
  tbody.innerHTML = ""

  formasPagamento.forEach((forma) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${forma.id}</td>
            <td>${forma.nome}</td>
            <td>${forma.descricao || "-"}</td>
            <td>
                <span class="status-badge ${forma.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${forma.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="editFormaPagamento(${forma.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteFormaPagamento(${forma.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Search payment methods
function searchFormasPagamento() {
  const searchTerm = document.getElementById("searchFormaPagamento").value.toLowerCase()
  const filteredFormas = formasPagamento.filter(
    (forma) =>
      forma.nome.toLowerCase().includes(searchTerm) ||
      (forma.descricao && forma.descricao.toLowerCase().includes(searchTerm)),
  )

  const tbody = document.getElementById("formasPagamentoTableBody")
  tbody.innerHTML = ""

  filteredFormas.forEach((forma) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${forma.id}</td>
            <td>${forma.nome}</td>
            <td>${forma.descricao || "-"}</td>
            <td>
                <span class="status-badge ${forma.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${forma.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="editFormaPagamento(${forma.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteFormaPagamento(${forma.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Show add payment method modal
function showAddFormaPagamentoModal() {
  editingFormaPagamentoId = null
  document.getElementById("formaPagamentoModalTitle").textContent = "Nova Forma de Pagamento"
  document.getElementById("formaPagamentoForm").reset()
  document.getElementById("formaPagamentoId").value = ""
  document.getElementById("formaPagamentoModal").style.display = "block"
}

// Edit payment method
function editFormaPagamento(id) {
  const forma = formasPagamento.find((f) => f.id === id)
  if (!forma) return

  editingFormaPagamentoId = id
  document.getElementById("formaPagamentoModalTitle").textContent = "Editar Forma de Pagamento"
  document.getElementById("formaPagamentoId").value = forma.id
  document.getElementById("formaPagamentoNome").value = forma.nome
  document.getElementById("formaPagamentoDescricao").value = forma.descricao || ""
  document.getElementById("formaPagamentoStatus").value = forma.status
  document.getElementById("formaPagamentoModal").style.display = "block"
}

// Save payment method form
async function saveFormaPagamentoForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const formaPagamentoData = {
    nome: formData.get("nome").trim(),
    descricao: formData.get("descricao").trim(),
    status: formData.get("status"),
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const url = editingFormaPagamentoId ? `/api/formas-pagamento/${editingFormaPagamentoId}` : "/api/formas-pagamento"
    const method = editingFormaPagamentoId ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formaPagamentoData),
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
      throw new Error(result.message || "Erro ao salvar forma de pagamento")
    }

    showToast(
      editingFormaPagamentoId ? "Forma de pagamento atualizada com sucesso!" : "Forma de pagamento criada com sucesso!",
      "success",
    )
    closeFormaPagamentoModal()
    loadFormasPagamento()
  } catch (error) {
    showToast("Erro ao salvar forma de pagamento: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Delete payment method
async function deleteFormaPagamento(id) {
  if (!confirm("Tem certeza que deseja excluir esta forma de pagamento?")) return

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch(`/api/formas-pagamento/${id}`, {
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
      throw new Error(result.message || "Erro ao excluir forma de pagamento")
    }

    showToast("Forma de pagamento excluída com sucesso!", "success")
    loadFormasPagamento()
  } catch (error) {
    showToast("Erro ao excluir forma de pagamento: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Close payment method modal
function closeFormaPagamentoModal() {
  document.getElementById("formaPagamentoModal").style.display = "none"
  editingFormaPagamentoId = null
}

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("formaPagamentoModal")
  if (event.target === modal) {
    closeFormaPagamentoModal()
  }
}
