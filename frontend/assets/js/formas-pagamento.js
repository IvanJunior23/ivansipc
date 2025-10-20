// Formas de Pagamento Management JavaScript
let formasPagamento = []
let editingFormaPagamentoId = null

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
  loadFormasPagamento()
})

// Load payment methods from API
async function loadFormasPagamento() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/formas-pagamento?incluir_inativos=true", {
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

    const result = await response.json()
    formasPagamento = result.data || result
    console.log(" Loaded payment methods:", formasPagamento)
    renderFormasPagamentoTable()
  } catch (error) {
    console.error(" Error loading payment methods:", error)
    showToast("Erro ao carregar formas de pagamento: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render payment methods table
function renderFormasPagamentoTable() {
  const tbody = document.getElementById("formasPagamentoTableBody")
  tbody.innerHTML = ""

  if (formasPagamento.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: #7f8c8d;">
          <div class="empty-state">
            <i class="fas fa-credit-card fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Nenhuma forma de pagamento cadastrada</h5>
            <p class="text-muted">Clique em "Nova Forma de Pagamento" para adicionar a primeira forma de pagamento.</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  formasPagamento.forEach((forma) => {
    const row = document.createElement("tr")
    const isActive = forma.status === "ativo" || forma.status === true || forma.status === 1
    const statusClass = isActive ? "" : "inativo"

    row.className = `forma-pagamento-row ${statusClass}`
    row.setAttribute("data-id", forma.forma_pagamento_id)

    row.innerHTML = `
      <td>${forma.forma_pagamento_id}</td>
      <td>${forma.nome}</td>
      <td>${forma.descricao || "-"}</td>
      <td class="actions-column">
        <div class="action-buttons">
          <span class="status-badge ${isActive ? "status-ativo" : "status-inativo"}">
            ${isActive ? "Ativo" : "Inativo"}
          </span>
          <button class="btn-edit"
                  onclick="editFormaPagamento(${forma.forma_pagamento_id})"
                  title="Editar forma de pagamento">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn-toggle-status"
                  onclick="confirmAction('${isActive ? "desativar" : "ativar"}', 'forma de pagamento', function() { performToggleStatus(${forma.forma_pagamento_id}, ${!isActive}); })"
                  title="${isActive ? "Desativar" : "Ativar"} forma de pagamento">
            <i class="fas ${isActive ? "fa-eye-slash" : "fa-eye"}"></i>
          </button>
        </div>
      </td>
    `
    tbody.appendChild(row)
  })
}

// Filter payment methods
function filterFormasPagamento() {
  const statusFilter = document.getElementById("filterStatus").value

  let filteredFormas = formasPagamento

  if (statusFilter) {
    filteredFormas = filteredFormas.filter((forma) => {
      const isActive = forma.status === "ativo" || forma.status === true || forma.status === 1
      return statusFilter === "ativo" ? isActive : !isActive
    })
  }

  renderFilteredFormasPagamentoTable(filteredFormas)
}

// Search payment methods
function searchFormasPagamento() {
  const searchTerm = document.getElementById("searchFormaPagamento").value.toLowerCase()
  const filteredFormas = formasPagamento.filter(
    (forma) =>
      forma.nome.toLowerCase().includes(searchTerm) ||
      (forma.descricao && forma.descricao.toLowerCase().includes(searchTerm)),
  )

  renderFilteredFormasPagamentoTable(filteredFormas)
}

// Render filtered payment methods table
function renderFilteredFormasPagamentoTable(filteredFormas) {
  const tbody = document.getElementById("formasPagamentoTableBody")
  tbody.innerHTML = ""

  if (filteredFormas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: #7f8c8d;">
          <div class="empty-state">
            <i class="fas fa-credit-card fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Nenhuma forma de pagamento encontrada</h5>
          </div>
        </td>
      </tr>
    `
    return
  }

  filteredFormas.forEach((forma) => {
    const row = document.createElement("tr")
    const isActive = forma.status === "ativo" || forma.status === true || forma.status === 1
    const statusClass = isActive ? "" : "inativo"

    row.className = `forma-pagamento-row ${statusClass}`
    row.setAttribute("data-id", forma.forma_pagamento_id)

    row.innerHTML = `
      <td>${forma.forma_pagamento_id}</td>
      <td>${forma.nome}</td>
      <td>${forma.descricao || "-"}</td>
      <td class="actions-column">
        <div class="action-buttons">
          <span class="status-badge ${isActive ? "status-ativo" : "status-inativo"}">
            ${isActive ? "Ativo" : "Inativo"}
          </span>
          <button class="btn-edit"
                  onclick="editFormaPagamento(${forma.forma_pagamento_id})"
                  title="Editar forma de pagamento">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn-toggle-status"
                  onclick="confirmAction('${isActive ? "desativar" : "ativar"}', 'forma de pagamento', function() { performToggleStatus(${forma.forma_pagamento_id}, ${!isActive}); })"
                  title="${isActive ? "Desativar" : "Ativar"} forma de pagamento">
            <i class="fas ${isActive ? "fa-eye-slash" : "fa-eye"}"></i>
          </button>
        </div>
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
  document.getElementById("formaPagamentoStatus").value = "ativo"
  document.getElementById("formaPagamentoModal").style.display = "block"
}

// Edit payment method
function editFormaPagamento(id) {
  const forma = formasPagamento.find((f) => f.forma_pagamento_id === id)
  if (!forma) return

  editingFormaPagamentoId = id
  document.getElementById("formaPagamentoModalTitle").textContent = "Editar Forma de Pagamento"
  document.getElementById("formaPagamentoId").value = forma.forma_pagamento_id
  document.getElementById("formaPagamentoNome").value = forma.nome
  document.getElementById("formaPagamentoDescricao").value = forma.descricao || ""

  const isActive = forma.status === "ativo" || forma.status === true || forma.status === 1
  document.getElementById("formaPagamentoStatus").value = isActive ? "ativo" : "inativo"

  document.getElementById("formaPagamentoModal").style.display = "block"
}

// Save payment method form
async function saveFormaPagamentoForm(event) {
  event.preventDefault()

  console.log(" Form submission started")

  const formData = new FormData(event.target)
  const formaPagamentoData = {}

  for (const [key, value] of formData.entries()) {
    formaPagamentoData[key] = typeof value === "string" ? value.trim() : value
  }

  if (formaPagamentoData.status) {
    formaPagamentoData.status = formaPagamentoData.status === "ativo" ? true : false
  } else {
    // If no status is provided (new record), default to true (active)
    formaPagamentoData.status = true
  }

  console.log(" Data to be sent:", formaPagamentoData)

  try {
    showLoading()
    const token = getToken()
    if (!token) {
      console.log(" No token found, aborting save")
      return // getToken will handle redirect
    }

    const url = editingFormaPagamentoId ? `/api/formas-pagamento/${editingFormaPagamentoId}` : "/api/formas-pagamento"
    const method = editingFormaPagamentoId ? "PUT" : "POST"

    console.log(" Making request:", { url, method, data: formaPagamentoData })

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formaPagamentoData),
    })

    const result = await response.json()

    console.log(" Response received:", { status: response.status, result })

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
    console.error(" Error saving payment method:", error)
    showToast("Erro ao salvar forma de pagamento: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Toggle status
async function performToggleStatus(id, newStatus) {
  try {
    showLoading()
    const token = getToken()
    if (!token) return

    console.log("🔄 Alterando status da forma de pagamento ID:", id, "para:", newStatus)

    const response = await fetch(`/api/formas-pagamento/${id}/status`, {
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
    console.log("✅ Status alterado com sucesso:", result)

    const statusText = newStatus ? "ativada" : "inativada"
    showToast(`Forma de pagamento ${statusText} com sucesso!`, "success")

    setTimeout(async () => {
      await loadFormasPagamento()
    }, 500)
  } catch (error) {
    console.error("❌ Erro ao alterar status:", error)
    showToast(error.message || "Erro ao alterar status da forma de pagamento", "error")
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
  const formaPagamentoModal = document.getElementById("formaPagamentoModal")

  if (event.target === formaPagamentoModal) {
    closeFormaPagamentoModal()
  }
}

function confirmAction(action, item, callback) {
  const message = `Tem certeza que deseja ${action} esta ${item}?`
  if (confirm(message)) {
    callback()
  }
}
