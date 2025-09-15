// Marcas Management JavaScript
let marcas = []
let editingMarcaId = null

// Declare necessary functions
function checkAuth() {
  // Placeholder for authentication check
  console.log("Checking authentication...")
}

function showLoading() {
  // Placeholder for showing loading indicator
  console.log("Showing loading...")
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
  console.log("Hiding loading...")
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadMarcas()
})

// Load brands from API
async function loadMarcas() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/marcas", {
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
      throw new Error("Erro ao carregar marcas")
    }

    marcas = await response.json()
    renderMarcasTable()
  } catch (error) {
    showToast("Erro ao carregar marcas: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render brands table
function renderMarcasTable() {
  const tbody = document.getElementById("marcasTableBody")
  tbody.innerHTML = ""

  marcas.forEach((marca) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${marca.id}</td>
            <td>${marca.nome}</td>
            <td>${marca.descricao || "-"}</td>
            <td>
                <span class="status-badge ${marca.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${marca.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="editMarca(${marca.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteMarca(${marca.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Search brands
function searchMarcas() {
  const searchTerm = document.getElementById("searchMarca").value.toLowerCase()
  const filteredMarcas = marcas.filter(
    (marca) =>
      marca.nome.toLowerCase().includes(searchTerm) ||
      (marca.descricao && marca.descricao.toLowerCase().includes(searchTerm)),
  )

  const tbody = document.getElementById("marcasTableBody")
  tbody.innerHTML = ""

  filteredMarcas.forEach((marca) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${marca.id}</td>
            <td>${marca.nome}</td>
            <td>${marca.descricao || "-"}</td>
            <td>
                <span class="status-badge ${marca.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${marca.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="editMarca(${marca.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteMarca(${marca.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Show add brand modal
function showAddMarcaModal() {
  editingMarcaId = null
  document.getElementById("marcaModalTitle").textContent = "Nova Marca"
  document.getElementById("marcaForm").reset()
  document.getElementById("marcaId").value = ""
  document.getElementById("marcaModal").style.display = "block"
}

// Edit brand
function editMarca(id) {
  const marca = marcas.find((m) => m.id === id)
  if (!marca) return

  editingMarcaId = id
  document.getElementById("marcaModalTitle").textContent = "Editar Marca"
  document.getElementById("marcaId").value = marca.id
  document.getElementById("marcaNome").value = marca.nome
  document.getElementById("marcaDescricao").value = marca.descricao || ""
  document.getElementById("marcaStatus").value = marca.status
  document.getElementById("marcaModal").style.display = "block"
}

// Save brand form
async function saveMarcaForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const marcaData = {
    nome: formData.get("nome").trim(),
    descricao: formData.get("descricao").trim(),
    status: formData.get("status"),
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const url = editingMarcaId ? `/api/marcas/${editingMarcaId}` : "/api/marcas"
    const method = editingMarcaId ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(marcaData),
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
      throw new Error(result.message || "Erro ao salvar marca")
    }

    showToast(editingMarcaId ? "Marca atualizada com sucesso!" : "Marca criada com sucesso!", "success")
    closeMarcaModal()
    loadMarcas()
  } catch (error) {
    showToast("Erro ao salvar marca: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Delete brand
async function deleteMarca(id) {
  if (!confirm("Tem certeza que deseja excluir esta marca?")) return

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch(`/api/marcas/${id}`, {
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
      throw new Error(result.message || "Erro ao excluir marca")
    }

    showToast("Marca excluída com sucesso!", "success")
    loadMarcas()
  } catch (error) {
    showToast("Erro ao excluir marca: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Close brand modal
function closeMarcaModal() {
  document.getElementById("marcaModal").style.display = "none"
  editingMarcaId = null
}

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("marcaModal")
  if (event.target === modal) {
    closeMarcaModal()
  }
}
