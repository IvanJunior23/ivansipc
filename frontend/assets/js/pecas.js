// Peças Management JavaScript
let pecas = []
let categorias = []
let marcas = []
let editingPecaId = null
let selectedImages = []

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
  loadCategorias()
  loadMarcas()
  loadPecas()
})

// Load categories for dropdown
async function loadCategorias() {
  try {
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/categorias", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      categorias = await response.json()
      populateCategoriaDropdown()
    } else if (response.status === 401 || response.status === 403) {
      console.warn("Token expirado ou inválido, redirecionando para login...")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    }
  } catch (error) {
    console.error("Erro ao carregar categorias:", error)
  }
}

// Load brands for dropdown
async function loadMarcas() {
  try {
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/marcas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      marcas = await response.json()
      populateMarcaDropdown()
    } else if (response.status === 401 || response.status === 403) {
      console.warn("Token expirado ou inválido, redirecionando para login...")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    }
  } catch (error) {
    console.error("Erro ao carregar marcas:", error)
  }
}

// Populate category dropdown
function populateCategoriaDropdown() {
  const select = document.getElementById("pecaCategoria")
  const filterSelect = document.getElementById("filterCategoria")

  // Clear existing options (keep first option)
  select.innerHTML = '<option value="">Selecione a categoria</option>'
  filterSelect.innerHTML = '<option value="">Todas as Categorias</option>'

  categorias
    .filter((cat) => cat.status === "ativo")
    .forEach((categoria) => {
      const option = new Option(categoria.nome, categoria.id)
      const filterOption = new Option(categoria.nome, categoria.id)
      select.add(option)
      filterSelect.add(filterOption)
    })
}

// Populate brand dropdown
function populateMarcaDropdown() {
  const select = document.getElementById("pecaMarca")
  const filterSelect = document.getElementById("filterMarca")

  // Clear existing options (keep first option)
  select.innerHTML = '<option value="">Selecione a marca</option>'
  filterSelect.innerHTML = '<option value="">Todas as Marcas</option>'

  marcas
    .filter((marca) => marca.status === "ativo")
    .forEach((marca) => {
      const option = new Option(marca.nome, marca.id)
      const filterOption = new Option(marca.nome, marca.id)
      select.add(option)
      filterSelect.add(filterOption)
    })
}

// Load parts from API
async function loadPecas() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/pecas", {
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
      throw new Error("Erro ao carregar peças")
    }

    pecas = await response.json()
    renderPecasTable()
  } catch (error) {
    showToast("Erro ao carregar peças: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render parts table
function renderPecasTable() {
  const tbody = document.getElementById("pecasTableBody")
  tbody.innerHTML = ""

  pecas.forEach((peca) => {
    const row = document.createElement("tr")
    const stockClass = peca.quantidade_estoque <= peca.estoque_minimo ? "low-stock" : ""

    row.innerHTML = `
            <td>
                <div class="part-image">
                    ${
                      peca.imagem_principal
                        ? `<img src="/uploads/${peca.imagem_principal}" alt="${peca.nome}" onclick="viewPeca(${peca.id})">`
                        : '<i class="fas fa-image placeholder-icon"></i>'
                    }
                </div>
            </td>
            <td>${peca.codigo}</td>
            <td>
                <div class="part-name" onclick="viewPeca(${peca.id})">
                    ${peca.nome}
                    ${peca.descricao ? `<small>${peca.descricao}</small>` : ""}
                </div>
            </td>
            <td>${peca.categoria_nome}</td>
            <td>${peca.marca_nome}</td>
            <td>
                <span class="condition-badge condition-${peca.condicao}">
                    ${peca.condicao}
                </span>
            </td>
            <td class="${stockClass}">
                ${peca.quantidade_estoque}
                ${peca.quantidade_estoque <= peca.estoque_minimo ? '<i class="fas fa-exclamation-triangle text-warning"></i>' : ""}
            </td>
            <td>R$ ${Number.parseFloat(peca.preco_venda).toFixed(2)}</td>
            <td>
                <span class="status-badge ${peca.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${peca.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="viewPeca(${peca.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editPeca(${peca.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deletePeca(${peca.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Filter parts
function filterPecas() {
  const categoriaFilter = document.getElementById("filterCategoria").value
  const marcaFilter = document.getElementById("filterMarca").value
  const condicaoFilter = document.getElementById("filterCondicao").value

  let filteredPecas = pecas

  if (categoriaFilter) {
    filteredPecas = filteredPecas.filter((peca) => peca.categoria_id == categoriaFilter)
  }

  if (marcaFilter) {
    filteredPecas = filteredPecas.filter((peca) => peca.marca_id == marcaFilter)
  }

  if (condicaoFilter) {
    filteredPecas = filteredPecas.filter((peca) => peca.condicao === condicaoFilter)
  }

  renderFilteredPecasTable(filteredPecas)
}

// Search parts
function searchPecas() {
  const searchTerm = document.getElementById("searchPeca").value.toLowerCase()
  const filteredPecas = pecas.filter(
    (peca) =>
      peca.nome.toLowerCase().includes(searchTerm) ||
      peca.codigo.toLowerCase().includes(searchTerm) ||
      (peca.descricao && peca.descricao.toLowerCase().includes(searchTerm)),
  )

  renderFilteredPecasTable(filteredPecas)
}

// Render filtered parts table
function renderFilteredPecasTable(filteredPecas) {
  const tbody = document.getElementById("pecasTableBody")
  tbody.innerHTML = ""

  filteredPecas.forEach((peca) => {
    const row = document.createElement("tr")
    const stockClass = peca.quantidade_estoque <= peca.estoque_minimo ? "low-stock" : ""

    row.innerHTML = `
            <td>
                <div class="part-image">
                    ${
                      peca.imagem_principal
                        ? `<img src="/uploads/${peca.imagem_principal}" alt="${peca.nome}" onclick="viewPeca(${peca.id})">`
                        : '<i class="fas fa-image placeholder-icon"></i>'
                    }
                </div>
            </td>
            <td>${peca.codigo}</td>
            <td>
                <div class="part-name" onclick="viewPeca(${peca.id})">
                    ${peca.nome}
                    ${peca.descricao ? `<small>${peca.descricao}</small>` : ""}
                </div>
            </td>
            <td>${peca.categoria_nome}</td>
            <td>${peca.marca_nome}</td>
            <td>
                <span class="condition-badge condition-${peca.condicao}">
                    ${peca.condicao}
                </span>
            </td>
            <td class="${stockClass}">
                ${peca.quantidade_estoque}
                ${peca.quantidade_estoque <= peca.estoque_minimo ? '<i class="fas fa-exclamation-triangle text-warning"></i>' : ""}
            </td>
            <td>R$ ${Number.parseFloat(peca.preco_venda).toFixed(2)}</td>
            <td>
                <span class="status-badge ${peca.status === "ativo" ? "status-active" : "status-inactive"}">
                    ${peca.status}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="viewPeca(${peca.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editPeca(${peca.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deletePeca(${peca.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

// Preview selected images
function previewImages(event) {
  const files = event.target.files
  const previewContainer = document.getElementById("imagePreview")
  previewContainer.innerHTML = ""
  selectedImages = []

  Array.from(files).forEach((file, index) => {
    if (file.type.startsWith("image/")) {
      selectedImages.push(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageDiv = document.createElement("div")
        imageDiv.className = "image-preview-item"
        imageDiv.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-image" onclick="removeImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `
        previewContainer.appendChild(imageDiv)
      }
      reader.readAsDataURL(file)
    }
  })
}

// Remove image from preview
function removeImage(index) {
  selectedImages.splice(index, 1)

  // Update file input
  const dt = new DataTransfer()
  selectedImages.forEach((file) => dt.items.add(file))
  document.getElementById("pecaImagens").files = dt.files

  // Re-render preview
  previewImages({ target: { files: dt.files } })
}

// Show add part modal
function showAddPecaModal() {
  editingPecaId = null
  document.getElementById("pecaModalTitle").textContent = "Nova Peça"
  document.getElementById("pecaForm").reset()
  document.getElementById("pecaId").value = ""
  document.getElementById("imagePreview").innerHTML = ""
  selectedImages = []
  document.getElementById("pecaModal").style.display = "block"
}

// View part details
async function viewPeca(id) {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch(`/api/pecas/${id}`, {
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
      throw new Error("Erro ao carregar detalhes da peça")
    }

    const peca = await response.json()
    renderPecaDetails(peca)
    document.getElementById("viewPecaModal").style.display = "block"
  } catch (error) {
    showToast("Erro ao carregar detalhes: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render part details
function renderPecaDetails(peca) {
  const detailsContainer = document.getElementById("pecaDetails")
  const stockClass = peca.quantidade_estoque <= peca.estoque_minimo ? "low-stock" : ""

  detailsContainer.innerHTML = `
        <div class="part-details">
            <div class="part-images">
                ${
                  peca.imagens && peca.imagens.length > 0
                    ? peca.imagens.map((img) => `<img src="/uploads/${img.nome_arquivo}" alt="${peca.nome}">`).join("")
                    : '<div class="no-image"><i class="fas fa-image"></i><p>Nenhuma imagem disponível</p></div>'
                }
            </div>
            <div class="part-info">
                <h3>${peca.nome}</h3>
                <p><strong>Código:</strong> ${peca.codigo}</p>
                <p><strong>Categoria:</strong> ${peca.categoria_nome}</p>
                <p><strong>Marca:</strong> ${peca.marca_nome}</p>
                <p><strong>Condição:</strong> <span class="condition-badge condition-${peca.condicao}">${peca.condicao}</span></p>
                <p><strong>Descrição:</strong> ${peca.descricao || "Não informada"}</p>
                <p><strong>Localização:</strong> ${peca.localizacao || "Não informada"}</p>
                <div class="stock-info ${stockClass}">
                    <p><strong>Estoque:</strong> ${peca.quantidade_estoque} unidades</p>
                    <p><strong>Estoque Mínimo:</strong> ${peca.estoque_minimo} unidades</p>
                    ${
                      peca.quantidade_estoque <= peca.estoque_minimo
                        ? '<p class="warning"><i class="fas fa-exclamation-triangle"></i> Estoque baixo!</p>'
                        : ""
                    }
                </div>
                <div class="price-info">
                    <p><strong>Preço de Compra:</strong> R$ ${Number.parseFloat(peca.preco_compra).toFixed(2)}</p>
                    <p><strong>Preço de Venda:</strong> R$ ${Number.parseFloat(peca.preco_venda).toFixed(2)}</p>
                </div>
                <p><strong>Status:</strong> <span class="status-badge ${peca.status === "ativo" ? "status-active" : "status-inactive"}">${peca.status}</span></p>
            </div>
        </div>
    `
}

// Edit part
function editPeca(id) {
  const peca = pecas.find((p) => p.id === id)
  if (!peca) return

  editingPecaId = id
  document.getElementById("pecaModalTitle").textContent = "Editar Peça"
  document.getElementById("pecaId").value = peca.id
  document.getElementById("pecaCodigo").value = peca.codigo
  document.getElementById("pecaNome").value = peca.nome
  document.getElementById("pecaCategoria").value = peca.categoria_id
  document.getElementById("pecaMarca").value = peca.marca_id
  document.getElementById("pecaDescricao").value = peca.descricao || ""
  document.getElementById("pecaCondicao").value = peca.condicao
  document.getElementById("pecaStatus").value = peca.status
  document.getElementById("pecaQuantidadeEstoque").value = peca.quantidade_estoque
  document.getElementById("pecaEstoqueMinimo").value = peca.estoque_minimo
  document.getElementById("pecaPrecoCompra").value = peca.preco_compra
  document.getElementById("pecaPrecoVenda").value = peca.preco_venda
  document.getElementById("pecaLocalizacao").value = peca.localizacao || ""

  // Clear image preview for editing
  document.getElementById("imagePreview").innerHTML = ""
  selectedImages = []

  document.getElementById("pecaModal").style.display = "block"
}

// Save part form
async function savePecaForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)

  // Add selected images to form data
  selectedImages.forEach((file, index) => {
    formData.append("imagens", file)
  })

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const url = editingPecaId ? `/api/pecas/${editingPecaId}` : "/api/pecas"
    const method = editingPecaId ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
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
      throw new Error(result.message || "Erro ao salvar peça")
    }

    showToast(editingPecaId ? "Peça atualizada com sucesso!" : "Peça criada com sucesso!", "success")
    closePecaModal()
    loadPecas()
  } catch (error) {
    showToast("Erro ao salvar peça: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Delete part
async function deletePeca(id) {
  if (!confirm("Tem certeza que deseja excluir esta peça?")) return

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch(`/api/pecas/${id}`, {
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
      throw new Error(result.message || "Erro ao excluir peça")
    }

    showToast("Peça excluída com sucesso!", "success")
    loadPecas()
  } catch (error) {
    showToast("Erro ao excluir peça: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Export parts
function exportPecas() {
  // Implementation for exporting parts data
  showToast("Funcionalidade de exportação em desenvolvimento", "info")
}

// Close part modal
function closePecaModal() {
  document.getElementById("pecaModal").style.display = "none"
  editingPecaId = null
  selectedImages = []
}

// Close view part modal
function closeViewPecaModal() {
  document.getElementById("viewPecaModal").style.display = "none"
}

// Close modal when clicking outside
window.onclick = (event) => {
  const pecaModal = document.getElementById("pecaModal")
  const viewModal = document.getElementById("viewPecaModal")

  if (event.target === pecaModal) {
    closePecaModal()
  }
  if (event.target === viewModal) {
    closeViewPecaModal()
  }
}
