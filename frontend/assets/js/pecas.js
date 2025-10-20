// Peças Management JavaScript
let pecas = []
let categorias = []
let marcas = []
let imagens = [] // Added imagens array to store available images
let editingPecaId = null

// Declare necessary functions
function checkAuth() {
  console.log("Checking authentication...")
}

function showLoading() {
  console.log("Showing loading...")
}

function hideLoading() {
  console.log("Hiding loading...")
}

function showToast(message, type) {
  console.log(`Toast: ${message} (${type})`)
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

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadCategorias()
  loadMarcas()
  loadImagens() // Added loadImagens call
  loadPecas()
})

// Load categories for dropdown
async function loadCategorias() {
  try {
    console.log(" Iniciando carregamento de categorias...")
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/categorias", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log(" Resposta da API de categorias:", response.status)

    if (response.ok) {
      const responseData = await response.json()
      console.log(" Dados recebidos de categorias:", responseData)

      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        categorias = responseData.data
      } else if (Array.isArray(responseData)) {
        categorias = responseData
      } else {
        console.error("Resposta da API de categorias não é um array:", responseData)
        categorias = []
      }

      console.log(" Categorias processadas:", categorias)
      console.log(
        " Categorias ativas:",
        categorias.filter((cat) => cat.status === 1 || cat.status === true),
      )
      populateCategoriaDropdown()
    } else if (response.status === 401 || response.status === 403) {
      console.warn("Token expirado ou inválido, redirecionando para login...")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    } else {
      console.error(" Erro na API de categorias:", response.status, await response.text())
    }
  } catch (error) {
    console.error("Erro ao carregar categorias:", error)
  }
}

// Load brands for dropdown
async function loadMarcas() {
  try {
    console.log(" Iniciando carregamento de marcas...")
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/marcas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log(" Resposta da API de marcas:", response.status)

    if (response.ok) {
      const responseData = await response.json()
      console.log(" Dados recebidos de marcas:", responseData)

      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        marcas = responseData.data
      } else if (Array.isArray(responseData)) {
        marcas = responseData
      } else {
        console.error("Resposta da API de marcas não é um array:", responseData)
        marcas = []
      }

      console.log(" Marcas processadas:", marcas)
      console.log(
        " Marcas ativas:",
        marcas.filter((marca) => marca.status === 1 || marca.status === true),
      )
      populateMarcaDropdown()
    } else if (response.status === 401 || response.status === 403) {
      console.warn("Token expirado ou inválido, redirecionando para login...")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    } else {
      console.error(" Erro na API de marcas:", response.status, await response.text())
    }
  } catch (error) {
    console.error("Erro ao carregar marcas:", error)
  }
}

// Populate category dropdown
function populateCategoriaDropdown() {
  console.log(" Populando dropdown de categorias...")
  const select = document.getElementById("pecaCategoria")
  const filterSelect = document.getElementById("filterCategoria")

  if (!select) {
    console.error(" Elemento pecaCategoria não encontrado!")
    return
  }

  // Clear existing options (keep first option)
  select.innerHTML = '<option value="">Selecione a categoria</option>'
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">Todas as Categorias</option>'
  }

  const categoriasAtivas = categorias.filter((cat) => cat.status === 1 || cat.status === true)
  console.log(" Adicionando categorias ativas ao dropdown:", categoriasAtivas)

  categoriasAtivas.forEach((categoria) => {
    const option = new Option(categoria.nome, categoria.categoria_id)
    select.add(option)

    if (filterSelect) {
      const filterOption = new Option(categoria.nome, categoria.categoria_id)
      filterSelect.add(filterOption)
    }
  })

  console.log(" Dropdown de categorias populado com", categoriasAtivas.length, "itens")
}

// Populate brand dropdown
function populateMarcaDropdown() {
  console.log(" Populando dropdown de marcas...")
  const select = document.getElementById("pecaMarca")
  const filterSelect = document.getElementById("filterMarca")

  if (!select) {
    console.error(" Elemento pecaMarca não encontrado!")
    return
  }

  // Clear existing options (keep first option)
  select.innerHTML = '<option value="">Selecione a marca</option>'
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">Todas as Marcas</option>'
  }

  const marcasAtivas = marcas.filter((marca) => marca.status === 1 || marca.status === true)
  console.log(" Adicionando marcas ativas ao dropdown:", marcasAtivas)

  marcasAtivas.forEach((marca) => {
    const option = new Option(marca.nome, marca.marca_id)
    select.add(option)

    if (filterSelect) {
      const filterOption = new Option(marca.nome, marca.marca_id)
      filterSelect.add(filterOption)
    }
  })

  console.log(" Dropdown de marcas populado com", marcasAtivas.length, "itens")
}

// Load images for dropdown
async function loadImagens() {
  try {
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const response = await fetch("/api/imagens", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const responseData = await response.json()
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        imagens = responseData.data
      } else if (Array.isArray(responseData)) {
        imagens = responseData
      } else {
        console.error("Resposta da API de imagens não é um array:", responseData)
        imagens = []
      }
      populateImagemDropdown()
    } else if (response.status === 401 || response.status === 403) {
      console.warn("Token expirado ou inválido, redirecionando para login...")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    }
  } catch (error) {
    console.error("Erro ao carregar imagens:", error)
  }
}

// Populate image dropdown
function populateImagemDropdown() {
  const select = document.getElementById("pecaImagemPrincipal")

  if (!select) return // Element might not exist yet

  // Clear existing options (keep first option)
  select.innerHTML = '<option value="">Selecione uma imagem</option>'

  imagens
    .filter((img) => img.status === "ativo" || img.status === 1 || img.status === true)
    .forEach((imagem) => {
      // Use imagem_id from database, not id
      const option = new Option(imagem.descricao || `Imagem ${imagem.imagem_id}`, imagem.imagem_id)
      select.add(option)
    })
}

// Load parts from API
async function loadPecas() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    console.log(" Carregando todas as peças (ativas e inativas)...")

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

    const responseData = await response.json()
    console.log(" Resposta da API de peças:", responseData)

    if (responseData && responseData.data && Array.isArray(responseData.data)) {
      pecas = responseData.data
    } else if (Array.isArray(responseData)) {
      pecas = responseData
    } else {
      console.error("Resposta da API não é um array:", responseData)
      pecas = []
    }

    console.log(" Total de peças carregadas:", pecas.length)
    console.log(
      " Peças ativas:",
      pecas.filter((p) => p.status === true || p.status === 1 || p.status === "ativo").length,
    )
    console.log(
      " Peças inativas:",
      pecas.filter((p) => p.status === false || p.status === 0 || p.status === "inativo").length,
    )

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

  if (!pecas || pecas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-4">
          <div class="empty-state">
            <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Nenhuma peça encontrada</h5>
            <p class="text-muted">Clique em "Nova Peça" para adicionar a primeira peça.</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = ""

  pecas.forEach((peca) => {
    const row = document.createElement("tr")
    const stockClass = peca.quantidade_estoque <= peca.quantidade_minima ? "stock-low" : "stock-ok"
    const isActive = peca.status === "ativo" || peca.status === 1 || peca.status === true

    row.innerHTML = `
      <td>${peca.peca_id || peca.id}</td>
      <td>
        ${
          peca.imagem_principal || peca.referencia_url
            ? `<img src="${peca.imagem_principal || peca.referencia_url}" alt="${peca.nome}" class="part-image" onclick="viewPeca(${peca.peca_id || peca.id})" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; cursor: pointer;">`
            : '<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #f0f0f0; border-radius: 4px;"><i class="fas fa-image" style="font-size: 20px; color: #ccc;"></i></div>'
        }
      </td>
      <td>${peca.codigo || "-"}</td>
      <td>
        <strong>${peca.nome}</strong>
        ${peca.descricao ? `<br><small style="color: #6c757d;">${peca.descricao.substring(0, 50)}${peca.descricao.length > 50 ? "..." : ""}</small>` : ""}
      </td>
      <td>${peca.categoria_nome || "-"}</td>
      <td>${peca.marca_nome || "-"}</td>
      <td>
        <span class="status-badge" style="background-color: #e7f3ff; color: #004085; border-color: #b8daff;">
          ${peca.condicao ? peca.condicao.toUpperCase() : "-"}
        </span>
      </td>
      <td>
        <span class="status-badge ${stockClass}">
          ${peca.quantidade_estoque || 0}
          ${peca.quantidade_estoque <= peca.quantidade_minima ? ' <i class="fas fa-exclamation-triangle"></i>' : ""}
        </span>
      </td>
      <td>R$ ${peca.preco_venda ? Number.parseFloat(peca.preco_venda).toFixed(2) : "0.00"}</td>
      <td class="actions-column">
        <div class="action-buttons">
          <span class="status-badge ${isActive ? "status-ativo" : "status-inativo"}">
            ${isActive ? "ATIVO" : "INATIVO"}
          </span>
          <button class="btn-edit"
                  onclick="window.editPeca(${peca.peca_id || peca.id})"
                  title="Editar peça">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn-toggle-status"
                  onclick="window.togglePecaStatus(${peca.peca_id || peca.id}, ${isActive})"
                  title="${isActive ? "Desativar" : "Ativar"} peça">
            <i class="fas ${isActive ? "fa-eye-slash" : "fa-eye"}"></i>
          </button>
        </div>
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
  const statusFilter = document.getElementById("filterStatus").value

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

  if (statusFilter) {
    filteredPecas = filteredPecas.filter((peca) => peca.status === statusFilter)
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

  if (!filteredPecas || filteredPecas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-4">
          <div class="empty-state">
            <i class="fas fa-search fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Nenhuma peça encontrada</h5>
            <p class="text-muted">Tente ajustar os filtros ou a busca.</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = ""

  filteredPecas.forEach((peca) => {
    const row = document.createElement("tr")
    const stockClass = peca.quantidade_estoque <= peca.quantidade_minima ? "stock-low" : "stock-ok"
    const isActive = peca.status === "ativo" || peca.status === 1 || peca.status === true

    row.innerHTML = `
      <td>${peca.peca_id || peca.id}</td>
      <td>
        ${
          peca.imagem_principal || peca.referencia_url
            ? `<img src="${peca.imagem_principal || peca.referencia_url}" alt="${peca.nome}" class="part-image" onclick="viewPeca(${peca.peca_id || peca.id})" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; cursor: pointer;">`
            : '<div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background-color: #f0f0f0; border-radius: 4px;"><i class="fas fa-image" style="font-size: 20px; color: #ccc;"></i></div>'
        }
      </td>
      <td>${peca.codigo || "-"}</td>
      <td>
        <strong>${peca.nome}</strong>
        ${peca.descricao ? `<br><small class="text-muted">${peca.descricao}</small>` : ""}
      </td>
      <td>${peca.categoria_nome || "-"}</td>
      <td>${peca.marca_nome || "-"}</td>
      <td>
        <span class="status-badge" style="background-color: ${
          peca.condicao === "novo" ? "#d1ecf1" : peca.condicao === "usado" ? "#fff3cd" : "#d4edda"
        }; color: ${
          peca.condicao === "novo" ? "#0c5460" : peca.condicao === "usado" ? "#856404" : "#155724"
        }; border-color: ${peca.condicao === "novo" ? "#bee5eb" : peca.condicao === "usado" ? "#ffeaa7" : "#c3e6cb"};">
          ${peca.condicao ? peca.condicao.toUpperCase() : "N/A"}
        </span>
      </td>
      <td>
        <span class="status-badge ${
          peca.quantidade_estoque <= (peca.quantidade_minima || 0) ? "stock-low" : "stock-ok"
        }">
          ${peca.quantidade_estoque || 0}
        </span>
      </td>
      <td>R$ ${Number.parseFloat(peca.preco_venda || 0).toFixed(2)}</td>
      <td class="actions-column">
        <div class="action-buttons">
          <span class="status-badge ${isActive ? "status-ativo" : "status-inativo"}">
            ${isActive ? "ATIVO" : "INATIVO"}
          </span>
          <button class="btn-edit"
                  onclick="window.editPeca(${peca.peca_id || peca.id})"
                  title="Editar peça">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="btn-toggle-status"
                  onclick="window.togglePecaStatus(${peca.peca_id || peca.id}, ${isActive})"
                  title="${isActive ? "Desativar" : "Ativar"} peça">
            <i class="fas ${isActive ? "fa-eye-slash" : "fa-eye"}"></i>
          </button>
        </div>
      </td>
    `
    tbody.appendChild(row)
  })
}

// Show add part modal
function showAddPecaModal() {
  editingPecaId = null
  document.getElementById("pecaModalTitle").textContent = "Nova Peça"
  document.getElementById("pecaForm").reset()
  document.getElementById("pecaId").value = ""

  const imagemSelect = document.getElementById("pecaImagemPrincipal")
  const imagemNomeDiv = document.getElementById("pecaImagemNome")

  if (imagemSelect) {
    imagemSelect.style.display = "block"
    imagemSelect.removeAttribute("disabled")
    imagemSelect.setAttribute("required", "required")
    imagemSelect.value = ""
  }

  if (imagemNomeDiv) {
    imagemNomeDiv.style.display = "none"
  }

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
  const stockClass = peca.quantidade_estoque <= peca.quantidade_minima ? "low-stock" : ""

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
                    <p><strong>Estoque Mínimo:</strong> ${peca.quantidade_minima} unidades</p>
                    ${
                      peca.quantidade_estoque <= peca.quantidade_minima
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
async function editPeca(id) {
  console.log(" editPeca chamado com id:", id)

  try {
    showLoading()
    const token = getToken()
    if (!token) return

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
      throw new Error("Erro ao carregar peça")
    }

    const result = await response.json()
    const peca = result.data || result

    console.log(" Peça carregada da API:", peca)

    editingPecaId = id
    document.getElementById("pecaModalTitle").textContent = "Editar Peça"
    document.getElementById("pecaId").value = peca.peca_id || peca.id
    document.getElementById("pecaCodigo").value = peca.codigo || ""
    document.getElementById("pecaNome").value = peca.nome
    document.getElementById("pecaCategoria").value = peca.categoria_id
    document.getElementById("pecaMarca").value = peca.marca_id
    document.getElementById("pecaDescricao").value = peca.descricao || ""
    document.getElementById("pecaCondicao").value = peca.condicao
    document.getElementById("pecaQuantidadeEstoque").value = peca.quantidade_estoque || 0
    document.getElementById("pecaEstoqueMinimo").value = peca.quantidade_minima || peca.estoque_minimo || 0
    document.getElementById("pecaPrecoCompra").value = peca.preco_custo || peca.preco_compra || 0
    document.getElementById("pecaPrecoVenda").value = peca.preco_venda || 0
    document.getElementById("pecaLocalizacao").value = peca.localizacao || ""

    const imagemSelect = document.getElementById("pecaImagemPrincipal")
    const imagemNomeDiv = document.getElementById("pecaImagemNome")
    const imagemNomeText = document.getElementById("pecaImagemNomeText")

    if (peca.imagem_principal_id) {
      // Find the image name from the imagens array
      const imagem = imagens.find((img) => img.imagem_id == peca.imagem_principal_id)
      const imagemNome = imagem
        ? imagem.descricao || `Imagem ${imagem.imagem_id}`
        : `Imagem ID ${peca.imagem_principal_id}`

      // Hide the select and show the image name (read-only)
      imagemSelect.style.display = "none"
      imagemSelect.removeAttribute("required")
      imagemSelect.setAttribute("disabled", "disabled")
      imagemSelect.value = peca.imagem_principal_id

      imagemNomeDiv.style.display = "block"
      imagemNomeText.textContent = imagemNome
      imagemNomeText.style.color = "#004085"
    } else {
      // No image selected - show message that image is required but cannot be added during edit
      imagemSelect.style.display = "none"
      imagemSelect.removeAttribute("required")
      imagemSelect.setAttribute("disabled", "disabled")

      imagemNomeDiv.style.display = "block"
      imagemNomeText.textContent = "Nenhuma imagem vinculada (não é possível adicionar durante edição)"
      imagemNomeText.style.color = "#856404"
    }

    document.getElementById("pecaModal").style.display = "block"
  } catch (error) {
    console.error(" Erro ao carregar peça:", error)
    showToast("Erro ao carregar peça: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Save part form
async function savePecaForm(event) {
  event.preventDefault()

  console.log(" Iniciando salvamento de peça...")

  const formData = new FormData(event.target)

  console.log(" Dados do formulário:")
  for (const [key, value] of formData.entries()) {
    console.log(` ${key}: ${value}`)
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return // getToken will handle redirect

    const data = {}

    for (const [key, value] of formData.entries()) {
      // Skip image-related fields - they'll be handled separately
      if (key === "imagens" || key === "imagem_principal_id") continue

      // Add non-empty values
      if (value !== "") {
        data[key] = value
      }
    }

    if (!editingPecaId) {
      data.status = true
      console.log(" Nova peça - definindo status como ativo (true)")
    }

    // Get the selected image ID
    const imagemPrincipalId = formData.get("imagem_principal_id")
    console.log(" ID da imagem selecionada:", imagemPrincipalId)

    const url = editingPecaId ? `/api/pecas/${editingPecaId}` : "/api/pecas"
    const method = editingPecaId ? "PUT" : "POST"

    console.log(` Fazendo requisição ${method} para ${url}`)
    console.log(" Dados a serem enviados:", data)

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log(" Status da resposta:", response.status)

    const result = await response.json()
    console.log(" Resposta da API:", result)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }

      const errorMessage = result.details ? result.details.join(", ") : result.error || "Erro ao salvar peça"
      throw new Error(errorMessage)
    }

    // Get the part ID from the response
    const pecaId = editingPecaId || result.data?.peca_id || result.peca_id
    console.log(" ID da peça salva:", pecaId)
    console.log(" ID da imagem selecionada:", imagemPrincipalId)

    // Link image to part if an image was selected
    if (imagemPrincipalId && imagemPrincipalId !== "" && pecaId) {
      console.log(" Vinculando imagem à peça...")

      try {
        const linkResponse = await fetch(`/api/pecas/${pecaId}/imagens`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imagem_id: Number.parseInt(imagemPrincipalId) }),
        })

        console.log(" Status da resposta de vinculação:", linkResponse.status)

        if (linkResponse.ok) {
          console.log(" Imagem vinculada com sucesso!")
        } else {
          const errorText = await linkResponse.text()
          console.error(" Erro ao vincular imagem:", errorText)
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorText)
            throw new Error(errorJson.message || "Erro ao vincular imagem")
          } catch {
            throw new Error("Erro ao vincular imagem: " + errorText)
          }
        }
      } catch (linkError) {
        console.error(" Erro ao vincular imagem:", linkError)
        showToast("Peça salva, mas erro ao vincular imagem: " + linkError.message, "warning")
      }
    }

    showToast(editingPecaId ? "Peça atualizada com sucesso!" : "Peça criada com sucesso!", "success")
    closePecaModal()
    loadPecas()
  } catch (error) {
    console.error(" Erro ao salvar peça:", error)
    showToast("Erro ao salvar peça: " + error.message, "error")
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

async function togglePecaStatus(id, currentStatus) {
  console.log(" togglePecaStatus chamado com id:", id, "currentStatus:", currentStatus)

  // Convert current status to boolean
  const isCurrentlyActive = currentStatus === true || currentStatus === 1 || currentStatus === "ativo"
  const newStatus = !isCurrentlyActive // Toggle the status (invert the current value)
  const newStatusString = newStatus ? "ativo" : "inativo"
  const confirmMessage = `Deseja realmente ${newStatusString === "inativo" ? "inativar" : "ativar"} esta peça?`

  console.log(" Status atual (boolean):", isCurrentlyActive)
  console.log(" Novo status (boolean):", newStatus)
  console.log(" Novo status (string):", newStatusString)

  if (!confirm(confirmMessage)) {
    console.log(" Usuário cancelou a alteração de status")
    return
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    console.log(` Alterando status da peça ${id} para ${newStatusString}`)

    const response = await fetch(`/api/pecas/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatusString }),
    })

    console.log(" Status da resposta:", response.status)
    const responseText = await response.text()
    console.log(" Resposta completa:", responseText)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }

      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: responseText }
      }

      console.error(" Erro na resposta:", errorData)
      throw new Error(errorData.error || errorData.message || "Erro ao alterar status da peça")
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { message: "Status alterado com sucesso" }
    }

    console.log(" Resultado:", result)

    showToast(`Peça ${newStatusString === "inativo" ? "inativada" : "ativada"} com sucesso!`, "success")
    await loadPecas()
  } catch (error) {
    console.error(" Erro ao alterar status:", error)
    showToast(error.message || "Erro ao alterar status da peça", "error")
  } finally {
    hideLoading()
  }
}

// Make functions globally accessible
window.editPeca = editPeca
window.togglePecaStatus = togglePecaStatus
window.viewPeca = viewPeca
