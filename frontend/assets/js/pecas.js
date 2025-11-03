// Peças Management JavaScript
let pecas = []
let categorias = []
let marcas = []
let fornecedores = [] // Added fornecedores array
let imagens = [] // Added imagens array to store available images
let editingPecaId = null
let imagensSelecionadasPeca = []

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
  loadFornecedores() // Added loadFornecedores call
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

// Load suppliers
async function loadFornecedores() {
  try {
    console.log(" Iniciando carregamento de fornecedores...")
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/fornecedores", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log(" Resposta da API de fornecedores:", response.status)

    if (response.ok) {
      const responseData = await response.json()
      console.log(" Dados recebidos de fornecedores:", responseData)

      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        fornecedores = responseData.data
      } else if (Array.isArray(responseData)) {
        fornecedores = responseData
      } else {
        console.error("Resposta da API de fornecedores não é um array:", responseData)
        fornecedores = []
      }

      console.log(" Fornecedores processados:", fornecedores)
      populateFornecedorDropdown()
    } else if (response.status === 401 || response.status === 403) {
      console.warn("Token expirado ou inválido, redirecionando para login...")
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login.html"
    } else {
      console.error(" Erro na API de fornecedores:", response.status, await response.text())
    }
  } catch (error) {
    console.error("Erro ao carregar fornecedores:", error)
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

  select.removeEventListener("change", autoGenerateCodigoOnChange)
  select.addEventListener("change", autoGenerateCodigoOnChange)
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

  select.removeEventListener("change", autoGenerateCodigoOnChange)
  select.addEventListener("change", autoGenerateCodigoOnChange)
}

// Populate supplier dropdown
function populateFornecedorDropdown() {
  console.log(" Populando dropdown de fornecedores...")
  const select = document.getElementById("pecaFornecedor")

  if (!select) {
    console.error(" Elemento pecaFornecedor não encontrado!")
    return
  }

  select.innerHTML = '<option value="">Selecione o fornecedor (opcional)</option>'

  const fornecedoresAtivos = fornecedores.filter((f) => f.status === 1 || f.status === true || f.status === "ativo")
  console.log(" Adicionando fornecedores ativos ao dropdown:", fornecedoresAtivos)

  fornecedoresAtivos.forEach((fornecedor) => {
    const option = new Option(fornecedor.nome, fornecedor.fornecedor_id)
    select.add(option)
  })

  console.log(" Dropdown de fornecedores populado com", fornecedoresAtivos.length, "itens")
}

async function autoGenerateCodigoOnChange() {
  const categoriaId = document.getElementById("pecaCategoria").value
  const marcaId = document.getElementById("pecaMarca").value
  const codigoInput = document.getElementById("pecaCodigo")

  // Only auto-generate if both category and brand are selected
  // and the code field is empty or was auto-generated before
  if (categoriaId && marcaId && (!codigoInput.value || codigoInput.dataset.autoGenerated === "true")) {
    console.log(" Auto-gerando código para categoria:", categoriaId, "e marca:", marcaId)
    await gerarCodigoAutomatico()
    codigoInput.dataset.autoGenerated = "true"
  }
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
  const select = document.getElementById("pecaImagemSelect")

  if (!select) return // Element might not exist yet

  // Clear existing options (keep first option)
  select.innerHTML = '<option value="">Selecione uma imagem para adicionar</option>'

  imagens
    .filter((img) => img.status === "ativo" || img.status === 1 || img.status === true)
    .forEach((imagem) => {
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

    const response = await fetch("/api/pecas?incluirInativos=true", {
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
  imagensSelecionadasPeca = []
  document.getElementById("pecaModalTitle").textContent = "Nova Peça"
  document.getElementById("pecaForm").reset()
  document.getElementById("pecaId").value = ""

  const codigoInput = document.getElementById("pecaCodigo")
  if (codigoInput) {
    codigoInput.dataset.autoGenerated = "false"
  }

  renderImagensSelecionadas()

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
function renderPecaDetails(response) {
  console.log(" renderPecaDetails chamado com response:", response)

  // Extract peca from response (handle both direct object and nested data)
  const peca = response.data || response

  console.log(" Peça extraída:", peca)
  console.log(" Imagem principal:", peca.imagem_principal)

  const detailsContainer = document.getElementById("pecaDetails")
  const stockClass = (peca.quantidade_estoque || 0) <= (peca.quantidade_minima || 0) ? "low-stock" : ""

  // Get status display
  const isActive = peca.status === "ativo" || peca.status === 1 || peca.status === true
  const statusDisplay = isActive ? "ATIVO" : "INATIVO"
  const statusClass = isActive ? "status-ativo" : "status-inativo"

  const mainImageUrl = peca.imagem_principal || null

  console.log(" URL da imagem principal a ser exibida:", mainImageUrl)

  detailsContainer.innerHTML = `
    <div class="part-details" style="display: grid; grid-template-columns: 300px 1fr; gap: 30px;">
      <div class="part-images" style="display: flex; flex-direction: column; gap: 15px;">
        ${
          mainImageUrl
            ? `<img src="${mainImageUrl}" alt="${peca.nome || "Peça"}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; border: 2px solid #1ABC9C;">`
            : `<div class="no-image" style="width: 100%; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
                <i class="fas fa-image" style="font-size: 48px; color: #adb5bd; margin-bottom: 10px;"></i>
                <p style="color: #6c757d; margin: 0;">Nenhuma imagem disponível</p>
              </div>`
        }
      </div>
      <div class="part-info" style="display: flex; flex-direction: column; gap: 20px;">
        <div style="border-bottom: 2px solid #1ABC9C; padding-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0; color: #2C3E50; font-size: 24px;">${peca.nome || "Sem nome"}</h3>
          <span class="status-badge ${statusClass}" style="font-size: 12px;">${statusDisplay}</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Código:</strong></p>
            <p style="margin: 0; font-size: 16px;">${peca.codigo || "-"}</p>
          </div>
          <div>
            <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Categoria:</strong></p>
            <p style="margin: 0; font-size: 16px;">${peca.categoria_nome || "-"}</p>
          </div>
          <div>
            <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Marca:</strong></p>
            <p style="margin: 0; font-size: 16px;">${peca.marca_nome || "-"}</p>
          </div>
          <div>
            <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Condição:</strong></p>
            <p style="margin: 0; font-size: 16px;">
              <span class="status-badge" style="background-color: #e7f3ff; color: #004085; border-color: #b8daff;">
                ${peca.condicao ? peca.condicao.toUpperCase() : "-"}
              </span>
            </p>
          </div>
        </div>
        
        <div>
          <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Descrição:</strong></p>
          <p style="margin: 0; font-size: 14px; color: #495057;">${peca.descricao || "Não informada"}</p>
        </div>
        
        <div>
          <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Localização:</strong></p>
          <p style="margin: 0; font-size: 14px; color: #495057;">${peca.localizacao || "Não informada"}</p>
        </div>
        
        <div class="stock-info ${stockClass}" style="background-color: ${stockClass === "low-stock" ? "#fff3cd" : "#d4edda"}; padding: 15px; border-radius: 8px; border: 1px solid ${stockClass === "low-stock" ? "#ffeaa7" : "#c3e6cb"};">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Estoque:</strong></p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${stockClass === "low-stock" ? "#856404" : "#155724"};">
                ${peca.quantidade_estoque ?? 0} unidades
              </p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Estoque Mínimo:</strong></p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${stockClass === "low-stock" ? "#856404" : "#155724"};">
                ${peca.quantidade_minima ?? 0} unidades
              </p>
            </div>
          </div>
          ${
            (peca.quantidade_estoque || 0) <= (peca.quantidade_minima || 0)
              ? '<p style="margin: 10px 0 0 0; color: #856404; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> Estoque baixo!</p>'
              : ""
          }
        </div>
        
        <div class="price-info" style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Preço de Compra:</strong></p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2C3E50;">
                R$ ${peca.preco_custo || peca.preco_compra ? Number.parseFloat(peca.preco_custo || peca.preco_compra).toFixed(2) : "0.00"}
              </p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0;"><strong style="color: #6c757d;">Preço de Venda:</strong></p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1ABC9C;">
                R$ ${peca.preco_venda ? Number.parseFloat(peca.preco_venda).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </div>
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

    const codigoInput = document.getElementById("pecaCodigo")
    if (codigoInput) {
      codigoInput.dataset.autoGenerated = "false"
    }

    document.getElementById("pecaNome").value = peca.nome
    document.getElementById("pecaCategoria").value = peca.categoria_id
    document.getElementById("pecaMarca").value = peca.marca_id
    document.getElementById("pecaFornecedor").value = peca.fornecedor_id || "" // Added fornecedor field
    document.getElementById("pecaDescricao").value = peca.descricao || ""
    document.getElementById("pecaCondicao").value = peca.condicao
    document.getElementById("pecaQuantidadeEstoque").value = peca.quantidade_estoque || 0
    document.getElementById("pecaEstoqueMinimo").value = peca.quantidade_minima || peca.estoque_minimo || 0
    document.getElementById("pecaPrecoCompra").value = peca.preco_custo || peca.preco_compra || 0
    document.getElementById("pecaPrecoVenda").value = peca.preco_venda || 0
    document.getElementById("pecaLocalizacao").value = peca.localizacao || ""

    await carregarImagensPeca(id)

    document.getElementById("pecaModal").style.display = "block"
  } catch (error) {
    console.error(" Erro ao carregar peça:", error)
    showToast("Erro ao carregar peça: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

async function carregarImagensPeca(pecaId) {
  try {
    const token = getToken()
    if (!token) return

    const response = await fetch(`/api/pecas/${pecaId}/imagens`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const result = await response.json()
      const imagensDaPeca = result.data || result

      // Map to our selected images format
      imagensSelecionadasPeca = imagensDaPeca.map((img) => ({
        imagem_id: img.imagem_id,
        descricao: img.descricao,
        referencia_url: img.referencia_url,
      }))

      renderImagensSelecionadas()
    }
  } catch (error) {
    console.error("Erro ao carregar imagens da peça:", error)
  }
}

function adicionarImagemPeca() {
  const select = document.getElementById("pecaImagemSelect")
  const imagemId = select.value

  if (!imagemId) {
    showToast("Selecione uma imagem primeiro", "warning")
    return
  }

  // Check if image is already selected
  if (imagensSelecionadasPeca.find((img) => img.imagem_id == imagemId)) {
    showToast("Esta imagem já foi adicionada", "warning")
    return
  }

  // Find image details
  const imagem = imagens.find((img) => img.imagem_id == imagemId)
  if (!imagem) {
    showToast("Imagem não encontrada", "error")
    return
  }

  // Add to selected images
  imagensSelecionadasPeca.push({
    imagem_id: imagem.imagem_id,
    descricao: imagem.descricao,
    referencia_url: imagem.referencia_url,
  })

  // Reset select
  select.value = ""

  // Re-render images
  renderImagensSelecionadas()

  showToast("Imagem adicionada com sucesso", "success")
}

function removerImagemPeca(imagemId) {
  imagensSelecionadasPeca = imagensSelecionadasPeca.filter((img) => img.imagem_id != imagemId)
  renderImagensSelecionadas()
  showToast("Imagem removida", "info")
}

function moverImagemCima(index) {
  if (index === 0) return // Already at top

  const temp = imagensSelecionadasPeca[index]
  imagensSelecionadasPeca[index] = imagensSelecionadasPeca[index - 1]
  imagensSelecionadasPeca[index - 1] = temp

  renderImagensSelecionadas()
}

function moverImagemBaixo(index) {
  if (index === imagensSelecionadasPeca.length - 1) return // Already at bottom

  const temp = imagensSelecionadasPeca[index]
  imagensSelecionadasPeca[index] = imagensSelecionadasPeca[index + 1]
  imagensSelecionadasPeca[index + 1] = temp

  renderImagensSelecionadas()
}

function renderImagensSelecionadas() {
  const container = document.getElementById("imagensSelecionadas")
  const nenhumaMsg = document.getElementById("nenhumaImagemMsg")

  if (!container) return

  if (imagensSelecionadasPeca.length === 0) {
    container.style.display = "none"
    if (nenhumaMsg) nenhumaMsg.style.display = "block"
    return
  }

  container.style.display = "grid"
  if (nenhumaMsg) nenhumaMsg.style.display = "none"

  container.innerHTML = imagensSelecionadasPeca
    .map(
      (img, index) => `
    <div style="position: relative; border: 2px solid ${index === 0 ? "#1ABC9C" : "#e9ecef"}; border-radius: 8px; padding: 8px; background-color: white;">
      ${
        index === 0
          ? '<div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background-color: #1ABC9C; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">PRINCIPAL</div>'
          : ""
      }
      <img src="${img.referencia_url}" alt="${img.descricao}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
      <p style="font-size: 11px; color: #6c757d; margin: 0 0 8px 0; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${img.descricao || "Sem descrição"}</p>
      <div style="display: flex; gap: 4px; justify-content: center;">
        ${
          index > 0
            ? `<button type="button" onclick="moverImagemCima(${index})" style="padding: 4px 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;" title="Mover para cima">
            <i class="fas fa-arrow-up"></i>
          </button>`
            : ""
        }
        ${
          index < imagensSelecionadasPeca.length - 1
            ? `<button type="button" onclick="moverImagemBaixo(${index})" style="padding: 4px 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;" title="Mover para baixo">
            <i class="fas fa-arrow-down"></i>
          </button>`
            : ""
        }
        <button type="button" onclick="removerImagemPeca(${img.imagem_id})" style="padding: 4px 8px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;" title="Remover imagem">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `,
    )
    .join("")
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

  if (imagensSelecionadasPeca.length === 0) {
    showToast("Adicione pelo menos uma imagem para a peça", "warning")
    return
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const data = {}

    for (const [key, value] of formData.entries()) {
      // Skip image-related fields - they'll be handled separately
      if (key === "imagens" || key === "imagem_principal_id") continue

      if (key === "fornecedor_id") {
        data[key] = value === "" ? null : value
        continue
      }

      // Add non-empty values
      if (value !== "") {
        data[key] = value
      }
    }

    if (!data.hasOwnProperty("fornecedor_id")) {
      data.fornecedor_id = null
    }

    console.log(" Dados a serem enviados (incluindo fornecedor_id):", data)

    if (!editingPecaId) {
      data.status = true
      console.log(" Nova peça - definindo status como ativo (true)")
    }

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

    let currentImageIds = []
    if (editingPecaId) {
      try {
        const currentImagesResponse = await fetch(`/api/pecas/${pecaId}/imagens`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (currentImagesResponse.ok) {
          const currentImagesResult = await currentImagesResponse.json()
          const currentImages = currentImagesResult.data || currentImagesResult
          currentImageIds = currentImages.map((img) => Number.parseInt(img.imagem_id))
          console.log(" Imagens atualmente vinculadas:", currentImageIds)
        }
      } catch (error) {
        console.error(" Erro ao buscar imagens atuais:", error)
      }
    }

    const selectedImageIds = imagensSelecionadasPeca.map((img) => Number.parseInt(img.imagem_id))
    console.log(" Imagens selecionadas:", selectedImageIds)

    const imagesToAdd = selectedImageIds.filter((id) => !currentImageIds.includes(id))
    console.log(" Imagens para adicionar:", imagesToAdd)

    const imagesToRemove = currentImageIds.filter((id) => !selectedImageIds.includes(id))
    console.log(" Imagens para remover:", imagesToRemove)

    for (const imagemId of imagesToRemove) {
      try {
        console.log(" Removendo imagem:", imagemId)
        await fetch(`/api/pecas/${pecaId}/imagens/${imagemId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error(" Erro ao remover imagem:", imagemId, error)
      }
    }

    for (const imagemId of imagesToAdd) {
      try {
        console.log(" Adicionando nova imagem:", imagemId)
        const linkResponse = await fetch(`/api/pecas/${pecaId}/imagens`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imagem_id: imagemId }),
        })

        if (!linkResponse.ok) {
          const errorText = await linkResponse.text()
          console.error(" Erro ao vincular imagem:", errorText)
        } else {
          console.log(" Imagem vinculada com sucesso:", imagemId)
        }
      } catch (linkError) {
        console.error(" Erro ao vincular imagem:", linkError)
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
  imagensSelecionadasPeca = []
}

// Close view part modal
function closeViewPecaModal() {
  document.getElementById("viewPecaModal").style.display = "none"
}

// Close modal when clicking outside
window.onclick = (event) => {
  const pecaModal = document.getElementById("pecaModal")
  const viewModal = document.getElementById("viewPecaModal")
  const categoriaInlineModal = document.getElementById("addCategoriaInlineModal")
  const marcaInlineModal = document.getElementById("addMarcaInlineModal")
  const imagemInlineModal = document.getElementById("uploadImagemInlineModal")
  const fornecedorInlineModal = document.getElementById("addFornecedorInlineModal") // Added

  if (event.target === pecaModal) {
    closePecaModal()
  }
  if (event.target === viewModal) {
    closeViewPecaModal()
  }
  if (event.target === categoriaInlineModal) {
    closeAddCategoriaInlineModal()
  }
  if (event.target === marcaInlineModal) {
    closeAddMarcaInlineModal()
  }
  if (event.target === imagemInlineModal) {
    closeUploadImagemInlineModal()
  }
  if (event.target === fornecedorInlineModal) {
    // Added
    closeAddFornecedorInlineModal()
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

async function gerarCodigoAutomatico() {
  try {
    const categoriaId = document.getElementById("pecaCategoria").value
    const marcaId = document.getElementById("pecaMarca").value

    if (!categoriaId || !marcaId) {
      showToast("Selecione categoria e marca primeiro para gerar código automático", "warning")
      return
    }

    const token = getToken()
    if (!token) return

    console.log(" Gerando código automático para categoria:", categoriaId, "e marca:", marcaId)

    const response = await fetch(`/api/pecas/gerar-codigo?categoria_id=${categoriaId}&marca_id=${marcaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const result = await response.json()
      const codigoInput = document.getElementById("pecaCodigo")
      codigoInput.value = result.data.codigo
      codigoInput.dataset.autoGenerated = "true" // Mark as auto-generated
      console.log(" Código gerado:", result.data.codigo)
      showToast("Código gerado automaticamente!", "success")
    } else {
      throw new Error("Erro ao gerar código")
    }
  } catch (error) {
    console.error(" Erro ao gerar código:", error)
    showToast("Erro ao gerar código automático", "error")
  }
}

window.gerarCodigoAutomatico = gerarCodigoAutomatico

// Make functions globally accessible
window.editPeca = editPeca
window.togglePecaStatus = togglePecaStatus
window.viewPeca = viewPeca
window.adicionarImagemPeca = adicionarImagemPeca
window.removerImagemPeca = removerImagemPeca
window.moverImagemCima = moverImagemCima
window.moverImagemBaixo = moverImagemBaixo

function showAddCategoriaInlineModal() {
  document.getElementById("addCategoriaInlineForm").reset()
  document.getElementById("addCategoriaInlineModal").style.display = "block"
}

function closeAddCategoriaInlineModal() {
  document.getElementById("addCategoriaInlineModal").style.display = "none"
}

async function saveCategoriaInline(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const data = {
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || "",
    status: true,
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/categorias", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      throw new Error("Erro ao criar categoria")
    }

    const result = await response.json()
    const newCategoriaId = result.data?.categoria_id || result.categoria_id

    showToast("Categoria criada com sucesso!", "success")
    closeAddCategoriaInlineModal()

    // Reload categories and select the new one
    await loadCategorias()
    document.getElementById("pecaCategoria").value = newCategoriaId
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    showToast("Erro ao criar categoria: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

function showAddMarcaInlineModal() {
  document.getElementById("addMarcaInlineForm").reset()
  document.getElementById("addMarcaInlineModal").style.display = "block"
}

function closeAddMarcaInlineModal() {
  document.getElementById("addMarcaInlineModal").style.display = "none"
}

async function saveMarcaInline(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const data = {
    nome: formData.get("nome"),
    descricao: formData.get("descricao") || "",
    status: true,
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/marcas", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      throw new Error("Erro ao criar marca")
    }

    const result = await response.json()
    const newMarcaId = result.data?.marca_id || result.marca_id

    showToast("Marca criada com sucesso!", "success")
    closeAddMarcaInlineModal()

    // Reload brands and select the new one
    await loadMarcas()
    document.getElementById("pecaMarca").value = newMarcaId
  } catch (error) {
    console.error("Erro ao criar marca:", error)
    showToast("Erro ao criar marca: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

function showUploadImagemInlineModal() {
  document.getElementById("uploadImagemInlineForm").reset()
  document.getElementById("imagePreview").style.display = "none"
  document.getElementById("uploadImagemInlineModal").style.display = "block"

  // Add event listener for file input to show preview
  const fileInput = document.getElementById("inlineImagemArquivo")
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        document.getElementById("previewImg").src = event.target.result
        document.getElementById("imagePreview").style.display = "block"
      }
      reader.readAsDataURL(file)
    }
  })
}

function closeUploadImagemInlineModal() {
  document.getElementById("uploadImagemInlineModal").style.display = "none"
}

async function saveImagemInline(event) {
  event.preventDefault()

  console.log(" Iniciando upload de imagem inline...")

  const formData = new FormData(event.target)

  console.log(" FormData contents:")
  for (const [key, value] of formData.entries()) {
    console.log(`   ${key}:`, value)
  }

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    console.log(" Enviando requisição para /api/imagens...")

    const response = await fetch("/api/imagens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    console.log(" Resposta recebida:", response.status)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      const errorText = await response.text()
      console.error(" Erro na resposta:", errorText)
      throw new Error("Erro ao fazer upload da imagem")
    }

    const result = await response.json()
    console.log(" Resultado do upload:", result)

    const newImagemId = result.data?.[0]?.imagem_id || result.data?.imagem_id || result.imagem_id

    console.log(" ID da nova imagem:", newImagemId)

    showToast("Imagem enviada com sucesso!", "success")
    closeUploadImagemInlineModal()

    // Reload images and add the new one to the part
    await loadImagens()

    // Automatically add the new image to the selected images list
    const novaImagem = imagens.find((img) => img.imagem_id == newImagemId)
    if (novaImagem) {
      console.log(" Adicionando nova imagem à lista de selecionadas:", novaImagem)
      imagensSelecionadasPeca.push({
        imagem_id: novaImagem.imagem_id,
        descricao: novaImagem.descricao,
        referencia_url: novaImagem.referencia_url,
      })
      renderImagensSelecionadas()
      showToast("Imagem adicionada à peça automaticamente!", "info")
    } else {
      console.warn(" Nova imagem não encontrada na lista após reload")
    }
  } catch (error) {
    console.error(" Erro ao fazer upload da imagem:", error)
    showToast("Erro ao fazer upload: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

function showAddFornecedorInlineModal() {
  document.getElementById("addFornecedorInlineForm").reset()
  document.getElementById("addFornecedorInlineModal").style.display = "block"
}

function closeAddFornecedorInlineModal() {
  document.getElementById("addFornecedorInlineModal").style.display = "none"
}

async function saveFornecedorInline(event) {
  event.preventDefault()

  const formData = new FormData(event.target)

  const data = {
    nome: formData.get("nome"),
    razao_social: formData.get("razao_social") || formData.get("nome"), // Use nome as fallback
    cnpj: formData.get("cnpj"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    logradouro: formData.get("logradouro") || "",
    numero: formData.get("numero") || "",
    complemento: formData.get("complemento") || "",
    bairro: formData.get("bairro") || "",
    cidade: formData.get("cidade") || "",
    estado: formData.get("estado") || "",
    cep: formData.get("cep") || "",
    status: "ativo",
  }

  console.log(" Dados do fornecedor a serem enviados:", data)

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/fornecedores", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log(" Resposta do servidor:", response.status)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      const errorData = await response.json()
      console.error(" Erro ao criar fornecedor:", errorData)
      throw new Error(errorData.error || "Erro ao criar fornecedor")
    }

    const result = await response.json()
    console.log(" Fornecedor criado com sucesso:", result)

    const newFornecedorId = result.data?.fornecedor_id || result.fornecedor_id

    showToast("Fornecedor criado com sucesso!", "success")
    closeAddFornecedorInlineModal()

    // Reload suppliers and select the new one
    await loadFornecedores()
    document.getElementById("pecaFornecedor").value = newFornecedorId
  } catch (error) {
    console.error(" Erro ao criar fornecedor:", error)
    showToast("Erro ao criar fornecedor: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

window.showAddCategoriaInlineModal = showAddCategoriaInlineModal
window.closeAddCategoriaInlineModal = closeAddCategoriaInlineModal
window.saveCategoriaInline = saveCategoriaInline
window.showAddMarcaInlineModal = showAddMarcaInlineModal
window.closeAddMarcaInlineModal = closeAddMarcaInlineModal
window.saveMarcaInline = saveMarcaInline
window.showUploadImagemInlineModal = showUploadImagemInlineModal
window.closeUploadImagemInlineModal = closeUploadImagemInlineModal
window.saveImagemInline = saveImagemInline
window.showAddFornecedorInlineModal = showAddFornecedorInlineModal
window.closeAddFornecedorInlineModal = closeAddFornecedorInlineModal
window.saveFornecedorInline = saveFornecedorInline
