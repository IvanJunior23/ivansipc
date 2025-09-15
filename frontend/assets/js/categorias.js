// Import or declare the auth variable before using it
const auth = {
  makeAuthenticatedRequest: async (url, options) => {
    // Placeholder implementation for makeAuthenticatedRequest
    const response = await fetch(url, options)
    return response
  },
}

let categorias = []
let editingCategoriaId = null

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadCategorias()
})

// Load categories from API
async function loadCategorias() {
  try {
    showLoading()
    const response = await auth.makeAuthenticatedRequest("/api/categorias", {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar categorias")
    }

    categorias = await response.json()
    renderCategoriasTable()
  } catch (error) {
    showToast("Erro ao carregar categorias: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

function renderCategoriasTable() {
  const tbody = document.getElementById("categoriasTableBody")
  tbody.innerHTML = ""

  categorias.forEach((categoria) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${categoria.id}</td>
            <td>${categoria.nome}</td>
            <td>${categoria.descricao || "-"}</td>
            <td>
                <span class="status-badge ${categoria.status === "ativo" ? "status-ativo" : "status-inativo"}">
                    ${categoria.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-edit" onclick="editCategoria(${categoria.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="deleteCategoria(${categoria.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Search categories
function searchCategorias() {
  const searchTerm = document.getElementById("searchCategoria").value.toLowerCase()
  const filteredCategorias = categorias.filter(
    (categoria) =>
      categoria.nome.toLowerCase().includes(searchTerm) ||
      (categoria.descricao && categoria.descricao.toLowerCase().includes(searchTerm)),
  )

  const tbody = document.getElementById("categoriasTableBody")
  tbody.innerHTML = ""

  filteredCategorias.forEach((categoria) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${categoria.id}</td>
            <td>${categoria.nome}</td>
            <td>${categoria.descricao || "-"}</td>
            <td>
                <span class="status-badge ${categoria.status === "ativo" ? "status-ativo" : "status-inativo"}">
                    ${categoria.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-edit" onclick="editCategoria(${categoria.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="deleteCategoria(${categoria.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Show add category modal
function showAddCategoriaModal() {
  editingCategoriaId = null
  document.getElementById("categoriaModalTitle").textContent = "Nova Categoria"
  document.getElementById("categoriaForm").reset()
  document.getElementById("categoriaId").value = ""
  document.getElementById("categoriaModal").style.display = "block"
}

// Edit category
function editCategoria(id) {
  const categoria = categorias.find((c) => c.id === id)
  if (!categoria) return

  editingCategoriaId = id
  document.getElementById("categoriaModalTitle").textContent = "Editar Categoria"
  document.getElementById("categoriaId").value = categoria.id
  document.getElementById("categoriaNome").value = categoria.nome
  document.getElementById("categoriaDescricao").value = categoria.descricao || ""
  document.getElementById("categoriaStatus").value = categoria.status
  document.getElementById("categoriaModal").style.display = "block"
}

async function saveCategoriaForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const categoriaData = {
    nome: formData.get("nome").trim(),
    descricao: formData.get("descricao").trim(),
    status: formData.get("status"),
  }

  if (!categoriaData.nome) {
    showToast("Nome da categoria é obrigatório", "error")
    return
  }

  if (!categoriaData.status) {
    showToast("Status é obrigatório", "error")
    return
  }

  try {
    showLoading()

    const url = editingCategoriaId ? `/api/categorias/${editingCategoriaId}` : "/api/categorias"
    const method = editingCategoriaId ? "PUT" : "POST"

    const response = await auth.makeAuthenticatedRequest(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoriaData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Erro ao salvar categoria")
    }

    showToast(editingCategoriaId ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!", "success")
    closeCategoriaModal()
    loadCategorias()
  } catch (error) {
    showToast("Erro ao salvar categoria: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

async function deleteCategoria(id) {
  if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

  try {
    showLoading()

    const response = await auth.makeAuthenticatedRequest(`/api/categorias/${id}`, {
      method: "DELETE",
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Erro ao excluir categoria")
    }

    showToast("Categoria excluída com sucesso!", "success")
    loadCategorias()
  } catch (error) {
    showToast("Erro ao excluir categoria: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Close category modal
function closeCategoriaModal() {
  document.getElementById("categoriaModal").style.display = "none"
  editingCategoriaId = null
}

function closeChangePasswordModal() {
  document.getElementById("changePasswordModal").style.display = "none"
}

async function changePassword(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const currentPassword = formData.get("currentPassword")
  const newPassword = formData.get("newPassword")
  const confirmNewPassword = formData.get("confirmNewPassword")

  if (newPassword !== confirmNewPassword) {
    showToast("As senhas não coincidem", "error")
    return
  }

  try {
    showLoading()

    const response = await auth.makeAuthenticatedRequest("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Erro ao alterar senha")
    }

    showToast("Senha alterada com sucesso!", "success")
    closeChangePasswordModal()
    document.getElementById("changePasswordForm").reset()
  } catch (error) {
    showToast("Erro ao alterar senha: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Close modal when clicking outside
window.onclick = (event) => {
  const categoriaModal = document.getElementById("categoriaModal")
  const passwordModal = document.getElementById("changePasswordModal")

  if (event.target === categoriaModal) {
    closeCategoriaModal()
  }

  if (event.target === passwordModal) {
    closeChangePasswordModal()
  }
}

function showLoading() {
  // Simple loading implementation
  document.body.style.cursor = "wait"
}

function hideLoading() {
  document.body.style.cursor = "default"
}

function showToast(message, type) {
  // Simple toast implementation
  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    z-index: 10000;
    font-weight: bold;
    ${type === "success" ? "background: #28a745;" : "background: #dc3545;"}
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, 3000)
}
