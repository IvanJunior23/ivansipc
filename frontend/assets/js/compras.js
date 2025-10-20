// Compras Management JavaScript
let compras = []
let fornecedores = []
let pecas = []
let editingCompraId = null
let currentViewCompraId = null

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
  alert(message)
}

function hideLoading() {
  console.log("Loading hidden...")
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadCompras()
  loadFornecedores()
  loadPecas()
})

// Load purchases from API
async function loadCompras() {
  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/compras", {
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
      throw new Error("Erro ao carregar compras")
    }

    const result = await response.json()
    compras = result.data || result
    renderComprasTable()
  } catch (error) {
    showToast("Erro ao carregar compras: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Load suppliers
async function loadFornecedores() {
  try {
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/fornecedores", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error("Erro ao carregar fornecedores")

    const result = await response.json()
    fornecedores = result.data || result

    // Populate fornecedor select
    const select = document.getElementById("compraFornecedor")
    select.innerHTML = '<option value="">Selecione o fornecedor</option>'
    fornecedores.forEach((fornecedor) => {
      const option = document.createElement("option")
      option.value = fornecedor.fornecedor_id
      option.textContent = fornecedor.nome
      select.appendChild(option)
    })
  } catch (error) {
    console.error("Erro ao carregar fornecedores:", error)
  }
}

// Load parts
async function loadPecas() {
  try {
    const token = getToken()
    if (!token) return

    const response = await fetch("/api/pecas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error("Erro ao carregar peças")

    const result = await response.json()
    pecas = result.data || result
  } catch (error) {
    console.error("Erro ao carregar peças:", error)
  }
}

// Render purchases table
function renderComprasTable() {
  const tbody = document.getElementById("comprasTableBody")
  tbody.innerHTML = ""

  if (!compras || compras.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma compra encontrada</td></tr>'
    return
  }

  compras.forEach((compra) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${compra.compra_id}</td>
            <td>${new Date(compra.data_compra).toLocaleDateString("pt-BR")}</td>
            <td>${compra.fornecedor_nome || "N/A"}</td>
            <td>R$ ${Number.parseFloat(compra.valor_total).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${compra.status}">
                    ${compra.status.charAt(0).toUpperCase() + compra.status.slice(1)}
                </span>
            </td>
            <td class="action-buttons">
                <button class="btn-sm btn-view" onclick="viewCompra(${compra.compra_id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                ${compra.status === "pendente" ? `` : ""}
            </td>
        `
    tbody.appendChild(row)
  })
}

// Filter purchases
function filterCompras() {
  const statusFilter = document.getElementById("filterStatus").value
  const dataInicio = document.getElementById("filterDataInicio").value
  const dataFim = document.getElementById("filterDataFim").value

  let filteredCompras = compras

  if (statusFilter) {
    filteredCompras = filteredCompras.filter((compra) => compra.status === statusFilter)
  }

  if (dataInicio) {
    filteredCompras = filteredCompras.filter((compra) => new Date(compra.data_compra) >= new Date(dataInicio))
  }

  if (dataFim) {
    filteredCompras = filteredCompras.filter((compra) => new Date(compra.data_compra) <= new Date(dataFim))
  }

  renderFilteredComprasTable(filteredCompras)
}

// Search purchases
function searchCompras() {
  const searchTerm = document.getElementById("searchCompra").value.toLowerCase()
  const filteredCompras = compras.filter(
    (compra) =>
      compra.compra_id.toString().includes(searchTerm) ||
      (compra.fornecedor_nome && compra.fornecedor_nome.toLowerCase().includes(searchTerm)),
  )

  renderFilteredComprasTable(filteredCompras)
}

// Render filtered purchases table
function renderFilteredComprasTable(filteredCompras) {
  const tbody = document.getElementById("comprasTableBody")
  tbody.innerHTML = ""

  if (!filteredCompras || filteredCompras.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma compra encontrada</td></tr>'
    return
  }

  filteredCompras.forEach((compra) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${compra.compra_id}</td>
            <td>${new Date(compra.data_compra).toLocaleDateString("pt-BR")}</td>
            <td>${compra.fornecedor_nome || "N/A"}</td>
            <td>R$ ${Number.parseFloat(compra.valor_total).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${compra.status}">
                    ${compra.status.charAt(0).toUpperCase() + compra.status.slice(1)}
                </span>
            </td>
            <td class="action-buttons">
                <button class="btn-sm btn-view" onclick="viewCompra(${compra.compra_id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                $$
            </td>
        `
    tbody.appendChild(row)
  })
}

// Show add purchase modal
function showAddCompraModal() {
  editingCompraId = null
  document.getElementById("compraModalTitle").textContent = "Nova Compra"
  document.getElementById("compraForm").reset()
  document.getElementById("compraId").value = ""
  document.getElementById("compraData").valueAsDate = new Date()
  document.getElementById("compraItems").innerHTML = ""
  addCompraItem()
  document.getElementById("compraModal").style.display = "block"
}

// Add purchase item
function addCompraItem() {
  const container = document.getElementById("compraItems")
  const itemIndex = container.children.length

  const itemRow = document.createElement("div")
  itemRow.className = "item-row"
  itemRow.innerHTML = `
        <div class="form-group">
            <label>Peça *</label>
            <select name="items[${itemIndex}][peca_id]" required onchange="updateItemPrice(this, ${itemIndex})">
                <option value="">Selecione a peça</option>
                ${pecas.map((peca) => `<option value="${peca.peca_id}" data-preco="${peca.preco_custo}">${peca.nome}</option>`).join("")}
            </select>
        </div>
        <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" name="items[${itemIndex}][quantidade]" min="1" required onchange="calculateItemTotal(${itemIndex})">
        </div>
        <div class="form-group">
            <label>Valor Unitário *</label>
            <input type="number" name="items[${itemIndex}][valor_unitario]" step="0.01" min="0" required onchange="calculateItemTotal(${itemIndex})">
        </div>
        <div class="form-group">
            <label>Subtotal</label>
            <input type="text" id="subtotal_${itemIndex}" readonly value="R$ 0.00">
        </div>
        <button type="button" class="remove-item" onclick="removeCompraItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `

  container.appendChild(itemRow)
}

// Update item price when part is selected
function updateItemPrice(select, index) {
  const selectedOption = select.options[select.selectedIndex]
  const preco = selectedOption.getAttribute("data-preco")
  const valorUnitarioInput = select.closest(".item-row").querySelector('input[name*="valor_unitario"]')
  if (preco && valorUnitarioInput) {
    valorUnitarioInput.value = Number.parseFloat(preco).toFixed(2)
    calculateItemTotal(index)
  }
}

// Calculate item total
function calculateItemTotal(index) {
  const itemRow = document.getElementById("compraItems").children[index]
  const quantidade = itemRow.querySelector('input[name*="quantidade"]').value
  const valorUnitario = itemRow.querySelector('input[name*="valor_unitario"]').value

  if (quantidade && valorUnitario) {
    const subtotal = Number.parseFloat(quantidade) * Number.parseFloat(valorUnitario)
    document.getElementById(`subtotal_${index}`).value = `R$ ${subtotal.toFixed(2)}`
  }

  calculateCompraTotal()
}

// Calculate purchase total
function calculateCompraTotal() {
  let total = 0
  const items = document.getElementById("compraItems").children

  for (let i = 0; i < items.length; i++) {
    const quantidade = items[i].querySelector('input[name*="quantidade"]').value
    const valorUnitario = items[i].querySelector('input[name*="valor_unitario"]').value

    if (quantidade && valorUnitario) {
      total += Number.parseFloat(quantidade) * Number.parseFloat(valorUnitario)
    }
  }

  document.getElementById("compraTotal").textContent = total.toFixed(2)
}

// Remove purchase item
function removeCompraItem(button) {
  const itemRow = button.closest(".item-row")
  itemRow.remove()
  calculateCompraTotal()
}

// View purchase details
async function viewCompra(id) {
  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch(`/api/compras/${id}`, {
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
      throw new Error("Erro ao carregar detalhes da compra")
    }

    const result = await response.json()
    const compra = result.data || result
    currentViewCompraId = id

    renderCompraDetails(compra)
    document.getElementById("viewCompraModal").style.display = "block"

    // Show receive button only if status is pendente
    const receberBtn = document.getElementById("receberCompraBtn")
    if (compra.status === "pendente") {
      receberBtn.style.display = "inline-flex"
    } else {
      receberBtn.style.display = "none"
    }
  } catch (error) {
    showToast("Erro ao carregar detalhes: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Render purchase details
function renderCompraDetails(compra) {
  const detailsContainer = document.getElementById("compraDetails")

  let itensHtml = ""
  if (compra.itens && compra.itens.length > 0) {
    itensHtml = `
      <h4>Itens da Compra:</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Peça</th>
            <th>Quantidade</th>
            <th>Valor Unitário</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${compra.itens
            .map(
              (item) => `
            <tr>
              <td>${item.peca_nome || "N/A"}</td>
              <td>${item.quantidade}</td>
              <td>R$ ${Number.parseFloat(item.valor_unitario).toFixed(2)}</td>
              <td>R$ ${(item.quantidade * Number.parseFloat(item.valor_unitario)).toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `
  } else {
    itensHtml = "<p><em>Nenhum item encontrado para esta compra.</em></p>"
  }

  detailsContainer.innerHTML = `
    <div class="compra-details">
      <p><strong>ID:</strong> ${compra.compra_id}</p>
      <p><strong>Data:</strong> ${new Date(compra.data_compra).toLocaleDateString("pt-BR")}</p>
      <p><strong>Fornecedor:</strong> ${compra.fornecedor_nome || "N/A"}</p>
      <p><strong>Valor Total:</strong> R$ ${Number.parseFloat(compra.valor_total).toFixed(2)}</p>
      <p><strong>Status:</strong> <span class="status-badge status-${compra.status}">${compra.status.charAt(0).toUpperCase() + compra.status.slice(1)}</span></p>
      ${itensHtml}
    </div>
  `
}

// Edit purchase
function editCompra(id) {
  // Implementation for editing purchase
  showToast("Funcionalidade de edição em desenvolvimento", "info")
}

// Save purchase form
async function saveCompraForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)

  const userData = JSON.parse(localStorage.getItem("user") || "{}")

  const fornecedorIdValue = formData.get("fornecedor_id")
  console.log(" Valor do fornecedor_id do formulário:", fornecedorIdValue)
  console.log(" Tipo do fornecedor_id:", typeof fornecedorIdValue)

  // Validar se fornecedor foi selecionado
  if (!fornecedorIdValue || fornecedorIdValue === "") {
    showToast("Por favor, selecione um fornecedor", "error")
    return
  }

  const fornecedorId = Number.parseInt(fornecedorIdValue)
  console.log(" fornecedor_id convertido:", fornecedorId)
  console.log(" É um número válido?", !Number.isNaN(fornecedorId))

  // Validar se a conversão foi bem-sucedida
  if (Number.isNaN(fornecedorId) || fornecedorId <= 0) {
    showToast("Fornecedor inválido. Por favor, selecione novamente.", "error")
    return
  }

  const compraData = {
    fornecedor_id: fornecedorId,
    data_compra: formData.get("data_compra"),
    usuario_id: userData.usuario_id || 1,
    itens: [],
  }

  console.log(" Dados da compra antes de enviar:", JSON.stringify(compraData, null, 2))

  // Collect items
  const items = document.getElementById("compraItems").children
  for (let i = 0; i < items.length; i++) {
    const pecaId = items[i].querySelector('select[name*="peca_id"]').value
    const quantidade = items[i].querySelector('input[name*="quantidade"]').value
    const valorUnitario = items[i].querySelector('input[name*="valor_unitario"]').value

    if (pecaId && quantidade && valorUnitario) {
      compraData.itens.push({
        peca_id: Number.parseInt(pecaId),
        quantidade: Number.parseInt(quantidade),
        valor_unitario: Number.parseFloat(valorUnitario),
      })
    }
  }

  if (compraData.itens.length === 0) {
    showToast("Adicione pelo menos um item à compra", "error")
    return
  }

  // Calculate total
  compraData.valor_total = compraData.itens.reduce((total, item) => total + item.quantidade * item.valor_unitario, 0)

  console.log(" Dados finais da compra:", JSON.stringify(compraData, null, 2))

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const url = editingCompraId ? `/api/compras/${editingCompraId}` : "/api/compras"
    const method = editingCompraId ? "PUT" : "POST"

    console.log(" Enviando requisição para:", url)
    console.log(" Método:", method)

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(compraData),
    })

    const result = await response.json()
    console.log(" Resposta do servidor:", result)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("Token expirado ou inválido, redirecionando para login...")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login.html"
        return
      }
      throw new Error(result.message || result.error || "Erro ao salvar compra")
    }

    showToast(editingCompraId ? "Compra atualizada com sucesso!" : "Compra criada com sucesso!", "success")
    closeCompraModal()
    loadCompras()
  } catch (error) {
    console.error(" Erro ao salvar compra:", error)
    showToast("Erro ao salvar compra: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Receive purchase (entrada de estoque)
async function receberCompra() {
  if (!currentViewCompraId) return

  if (!confirm("Confirma o recebimento desta compra? As peças serão adicionadas ao estoque.")) return

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch(`/api/compras/${currentViewCompraId}/receber`, {
      method: "PUT",
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
      throw new Error(result.message || "Erro ao receber compra")
    }

    showToast("Compra recebida com sucesso! Estoque atualizado.", "success")
    closeViewCompraModal()
    loadCompras()
  } catch (error) {
    showToast("Erro ao receber compra: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Delete purchase
async function deleteCompra(id) {
  if (!confirm("Tem certeza que deseja cancelar esta compra?")) return

  try {
    showLoading()
    const token = getToken()
    if (!token) return

    const response = await fetch(`/api/compras/${id}/cancelar`, {
      method: "PUT",
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
      throw new Error(result.message || "Erro ao cancelar compra")
    }

    showToast("Compra cancelada com sucesso!", "success")
    loadCompras()
  } catch (error) {
    showToast("Erro ao cancelar compra: " + error.message, "error")
  } finally {
    hideLoading()
  }
}

// Export purchases
function exportCompras() {
  showToast("Funcionalidade de exportação em desenvolvimento", "info")
}

// Close purchase modal
function closeCompraModal() {
  document.getElementById("compraModal").style.display = "none"
  editingCompraId = null
}

// Close view purchase modal
function closeViewCompraModal() {
  document.getElementById("viewCompraModal").style.display = "none"
  currentViewCompraId = null
}

// Close modal when clicking outside
window.onclick = (event) => {
  const compraModal = document.getElementById("compraModal")
  const viewModal = document.getElementById("viewCompraModal")

  if (event.target === compraModal) {
    closeCompraModal()
  }
  if (event.target === viewModal) {
    closeViewCompraModal()
  }
}
