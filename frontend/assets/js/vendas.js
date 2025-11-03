let vendas = []
let clientes = []
let pecas = []
let formasPagamento = []
let currentVendaId = null
let itemCounter = 0
let selectedClienteId = ""

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadVendas()
  loadClientes()
  loadPecas()
  loadFormasPagamento()

  // Set today's date as default
  document.getElementById("vendaData").valueAsDate = new Date()

  // Add first item row by default
  addVendaItem()

  // Listen for desconto changes to recalculate total
  document.getElementById("vendaDesconto").addEventListener("input", calculateVendaTotal)

  // Initialize searchable cliente filter
  initSearchableClienteFilter()
})

// Load Functions
async function loadVendas() {
  try {
    const response = await window.auth.authenticatedRequest("/api/vendas")
    if (!response.ok) throw new Error("Erro ao carregar vendas")

    const data = await response.json()
    vendas = data.data || []
    renderVendasTable()
  } catch (error) {
    console.error("Erro ao carregar vendas:", error)
    alert("Erro ao carregar vendas: " + error.message)
  }
}

async function loadClientes() {
  try {
    const response = await window.auth.authenticatedRequest("/api/clientes")
    if (!response.ok) throw new Error("Erro ao carregar clientes")

    const data = await response.json()
    clientes = data.data || []
    populateClienteSelect()
    populateClienteFilter()
  } catch (error) {
    console.error("Erro ao carregar clientes:", error)
  }
}

async function loadPecas() {
  try {
    const response = await window.auth.authenticatedRequest("/api/pecas")
    if (!response.ok) throw new Error("Erro ao carregar peças")

    const data = await response.json()
    pecas = data.data || []
  } catch (error) {
    console.error("Erro ao carregar peças:", error)
  }
}

async function loadFormasPagamento() {
  try {
    const response = await window.auth.authenticatedRequest("/api/formas-pagamento")
    if (!response.ok) throw new Error("Erro ao carregar formas de pagamento")

    const data = await response.json()
    formasPagamento = data.data || []
    populateFormaPagamentoSelects()
  } catch (error) {
    console.error("Erro ao carregar formas de pagamento:", error)
  }
}

// Render Functions
function renderVendasTable() {
  const tbody = document.getElementById("vendasTableBody")

  if (vendas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma venda encontrada</td></tr>'
    return
  }

  tbody.innerHTML = vendas
    .map(
      (venda) => `
        <tr>
            <td>${venda.venda_id}</td>
            <td>${formatDate(venda.data_hora)}</td>
            <td>${venda.cliente_nome || "N/A"}</td>
            <td>${venda.forma_pagamento_nome || "N/A"}</td>
            <td>R$ ${Number.parseFloat(venda.valor_total || 0).toFixed(2)}</td>
            <td><span class="status-badge status-${venda.status}">${getStatusLabel(venda.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-view" onclick="viewVenda(${venda.venda_id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${
                      venda.status === "pendente"
                        ? `
                        <button class="btn-sm btn-edit" onclick="editVenda(${venda.venda_id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-sm btn-success" onclick="finalizarVendaDirect(${venda.venda_id})" title="Finalizar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-sm btn-delete" onclick="cancelarVenda(${venda.venda_id})" title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    `
                        : ""
                    }
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

function populateClienteSelect() {
  const select = document.getElementById("vendaCliente")
  select.innerHTML =
    '<option value="">Selecione o cliente</option>' +
    clientes
      .filter((c) => c.status)
      .map((cliente) => `<option value="${cliente.cliente_id}">${cliente.nome} - ${cliente.cpf}</option>`)
      .join("")
}

function populatePecaSelect(selectElement) {
  selectElement.innerHTML =
    '<option value="">Selecione a peça</option>' +
    pecas
      .filter((p) => p.status && p.quantidade_estoque > 0)
      .map(
        (peca) =>
          `<option value="${peca.peca_id}" data-preco="${peca.preco_venda}" data-estoque="${peca.quantidade_estoque}">
                ${peca.nome} - R$ ${Number.parseFloat(peca.preco_venda || 0).toFixed(2)} (Estoque: ${peca.quantidade_estoque})
            </option>`,
      )
      .join("")
}

function populateFormaPagamentoSelects() {
  const modalSelect = document.getElementById("vendaFormaPagamento")
  const filterSelect = document.getElementById("filterFormaPagamento")

  const options = formasPagamento
    .filter((fp) => fp.status)
    .map((fp) => `<option value="${fp.forma_pagamento_id}">${fp.nome}</option>`)
    .join("")

  modalSelect.innerHTML = '<option value="">Selecione a forma de pagamento</option>' + options
  filterSelect.innerHTML = '<option value="">Todas as Formas</option>' + options
}

// Modal Functions
function showAddVendaModal() {
  if (pecas.length === 0) {
    alert("Carregando peças... Por favor, aguarde um momento e tente novamente.")
    return
  }

  currentVendaId = null
  document.getElementById("vendaModalTitle").textContent = "Nova Venda"
  document.getElementById("vendaForm").reset()
  document.getElementById("vendaId").value = ""
  document.getElementById("vendaData").valueAsDate = new Date()

  // Clear items and add one empty row
  document.getElementById("vendaItems").innerHTML = ""
  itemCounter = 0
  addVendaItem()

  calculateVendaTotal()
  document.getElementById("vendaModal").style.display = "block"
}

function closeVendaModal() {
  document.getElementById("vendaModal").style.display = "none"
}

function closeViewVendaModal() {
  document.getElementById("viewVendaModal").style.display = "none"
}

// Item Management
function addVendaItem() {
  itemCounter++
  const container = document.getElementById("vendaItems")
  const itemRow = document.createElement("div")
  itemRow.className = "item-row"
  itemRow.id = `item-${itemCounter}`

  itemRow.innerHTML = `
        <div class="form-group">
            <label>Peça *</label>
            <div class="searchable-select" id="searchable-select-${itemCounter}">
                <input type="text" 
                       placeholder="Digite para buscar..." 
                       class="searchable-select-input"
                       autocomplete="off"
                       onfocus="showPecaDropdown(${itemCounter})"
                       oninput="filterPecas(${itemCounter})">
                <input type="hidden" name="peca_id[]" required>
                <div class="searchable-select-dropdown" id="dropdown-${itemCounter}"></div>
            </div>
        </div>
        <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" name="quantidade[]" min="1" step="1" required onchange="calculateVendaTotal()">
        </div>
        <div class="form-group">
            <label>Valor Unit. *</label>
            <input type="number" name="valor_unitario[]" min="0" step="0.01" required onchange="calculateVendaTotal()">
        </div>
        <div class="form-group">
            <label>Desconto</label>
            <input type="number" name="desconto_item[]" min="0" step="0.01" value="0" onchange="calculateVendaTotal()">
        </div>
        <button type="button" class="remove-item" onclick="removeVendaItem(${itemCounter})">
            <i class="fas fa-trash"></i>
        </button>
    `

  container.appendChild(itemRow)

  renderPecaDropdown(itemCounter, pecas)
}

function showPecaDropdown(itemId) {
  const dropdown = document.getElementById(`dropdown-${itemId}`)
  dropdown.classList.add("active")
  renderPecaDropdown(itemId, pecas)
}

function filterPecas(itemId) {
  const input = document.querySelector(`#searchable-select-${itemId} .searchable-select-input`)
  const searchTerm = input.value.toLowerCase()

  const filtered = pecas.filter(
    (p) =>
      (p.status === true || p.status === 1) &&
      p.quantidade_estoque > 0 &&
      (p.nome.toLowerCase().includes(searchTerm) || p.peca_id.toString().includes(searchTerm)),
  )

  renderPecaDropdown(itemId, filtered)
}

function renderPecaDropdown(itemId, pecasList) {
  const dropdown = document.getElementById(`dropdown-${itemId}`)

  if (!dropdown) {
    console.error(`Dropdown not found for item ${itemId}`)
    return
  }

  const activePecas = pecasList.filter((p) => (p.status === true || p.status === 1) && p.quantidade_estoque > 0)

  if (activePecas.length === 0) {
    dropdown.innerHTML =
      '<div class="searchable-select-option" style="color: #999;">Nenhuma peça ativa com estoque encontrada</div>'
    return
  }

  dropdown.innerHTML = activePecas
    .map(
      (peca) => `
      <div class="searchable-select-option" 
           data-peca-id="${peca.peca_id}"
           data-preco="${peca.preco_venda}"
           data-estoque="${peca.quantidade_estoque}"
           onclick="selectPeca(${itemId}, ${peca.peca_id}, '${peca.nome.replace(/'/g, "\\'")}', ${peca.preco_venda}, ${peca.quantidade_estoque})">
        ${peca.nome} - R$ ${Number.parseFloat(peca.preco_venda || 0).toFixed(2)} (Estoque: ${peca.quantidade_estoque})
      </div>
    `,
    )
    .join("")
}

function selectPeca(itemId, pecaId, pecaNome, preco, estoque) {
  const container = document.getElementById(`searchable-select-${itemId}`)
  const input = container.querySelector(".searchable-select-input")
  const hiddenInput = container.querySelector('input[type="hidden"]')
  const dropdown = document.getElementById(`dropdown-${itemId}`)

  // Set values
  input.value = pecaNome
  hiddenInput.value = pecaId

  // Update price and quantity
  const itemRow = document.getElementById(`item-${itemId}`)
  const valorInput = itemRow.querySelector('input[name="valor_unitario[]"]')
  const quantidadeInput = itemRow.querySelector('input[name="quantidade[]"]')

  valorInput.value = Number.parseFloat(preco || 0).toFixed(2)
  quantidadeInput.max = estoque

  // Hide dropdown
  dropdown.classList.remove("active")

  calculateVendaTotal()
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".searchable-select")) {
    document.querySelectorAll(".searchable-select-dropdown").forEach((dropdown) => {
      dropdown.classList.remove("active")
    })
  }
})

function removeVendaItem(itemId) {
  const itemRow = document.getElementById(`item-${itemId}`)
  if (itemRow) {
    itemRow.remove()
    calculateVendaTotal()
  }

  // Ensure at least one item row exists
  const container = document.getElementById("vendaItems")
  if (container.children.length === 0) {
    addVendaItem()
  }
}

// Calculate total
function calculateVendaTotal() {
  let total = 0
  let subtotal = 0
  const vendaItems = document.getElementById("vendaItems").children

  for (let i = 0; i < vendaItems.length; i++) {
    const itemRow = vendaItems[i]
    const quantidade = Number(itemRow.querySelector('input[name="quantidade[]"]').value) || 0
    const valorUnitario = Number(itemRow.querySelector('input[name="valor_unitario[]"]').value) || 0
    const descontoItem = Number(itemRow.querySelector('input[name="desconto_item[]"]').value) || 0

    const itemTotal = quantidade * valorUnitario - descontoItem
    subtotal += quantidade * valorUnitario
    total += itemTotal
  }

  const descontoPercentual = Number(document.getElementById("vendaDesconto").value) || 0
  const descontoValor = (subtotal * descontoPercentual) / 100
  total -= descontoValor

  document.getElementById("vendaSubtotalValor").textContent = subtotal.toFixed(2)
  document.getElementById("vendaDescontoValor").textContent = descontoValor.toFixed(2)
  document.getElementById("vendaTotalValor").textContent = total.toFixed(2)
}

// Save Function
async function saveVendaForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const vendaId = document.getElementById("vendaId").value

  // Collect items
  const pecaIds = formData.getAll("peca_id[]")
  const quantidades = formData.getAll("quantidade[]")
  const valoresUnitarios = formData.getAll("valor_unitario[]")
  const descontosItem = formData.getAll("desconto_item[]")

  const itens = pecaIds
    .map((pecaId, index) => ({
      peca_id: Number.parseInt(pecaId),
      quantidade: Number.parseInt(quantidades[index]),
      valor_unitario: Number.parseFloat(valoresUnitarios[index]),
      desconto_item: Number.parseFloat(descontosItem[index]) || 0,
    }))
    .filter((item) => item.peca_id && item.quantidade > 0)

  if (itens.length === 0) {
    alert("Adicione pelo menos um item à venda")
    return
  }

  console.log(" === SALVANDO VENDA ===")
  console.log(" Itens da venda:", itens)

  // Verificar estoque atual das peças antes de salvar
  for (const item of itens) {
    const peca = pecas.find((p) => p.peca_id === item.peca_id)
    if (peca) {
      console.log(` Peça ${peca.nome} - Estoque ANTES de salvar: ${peca.quantidade_estoque}`)
    }
  }

  const userData = await window.auth.getCurrentUser()

  const vendaData = {
    cliente_id: Number.parseInt(formData.get("cliente_id")),
    usuario_id: userData.usuario_id,
    forma_pagamento_id: Number.parseInt(formData.get("forma_pagamento_id")),
    data_venda: formData.get("data_venda"),
    desconto_aplicado: Number.parseFloat(document.getElementById("vendaDescontoValor").textContent),
    observacoes: formData.get("observacoes"),
    itens: itens,
  }

  try {
    const url = vendaId ? `/api/vendas/${vendaId}` : "/api/vendas"
    const method = vendaId ? "PUT" : "POST"

    const response = await window.auth.authenticatedRequest(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendaData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Erro ao salvar venda")
    }

    console.log(" Venda salva com sucesso:", result)
    console.log(" Status da venda:", result.data?.status || "pendente")
    console.log(" IMPORTANTE: Estoque NÃO deve ter sido alterado ainda (venda está pendente)")

    alert(
      vendaId
        ? "Venda atualizada com sucesso!"
        : "Venda criada com sucesso! Status: PENDENTE (estoque não foi alterado)",
    )
    closeVendaModal()
    loadVendas()

    await loadPecas()

    // Verificar estoque DEPOIS de recarregar
    for (const item of itens) {
      const peca = pecas.find((p) => p.peca_id === item.peca_id)
      if (peca) {
        console.log(` Peça ${peca.nome} - Estoque DEPOIS de salvar: ${peca.quantidade_estoque}`)
      }
    }
    console.log(" === FIM DO SALVAMENTO ===")
  } catch (error) {
    console.error("Erro ao salvar venda:", error)
    alert("Erro ao salvar venda: " + error.message)
  }
}

// View/Edit Functions
async function viewVenda(id) {
  try {
    const response = await window.auth.authenticatedRequest(`/api/vendas/${id}`)
    if (!response.ok) throw new Error("Erro ao carregar venda")

    const result = await response.json()
    const venda = result.data

    const subtotal = Number.parseFloat(venda.valor_total) + Number.parseFloat(venda.desconto_aplicado || 0)
    const descontoPercentual = subtotal > 0 ? ((venda.desconto_aplicado || 0) / subtotal) * 100 : 0

    const detailsHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div><strong>ID:</strong> ${venda.venda_id}</div>
                <div><strong>Data:</strong> ${formatDateTime(venda.data_hora)}</div>
                <div><strong>Cliente:</strong> ${venda.cliente_nome}</div>
                <div><strong>Forma Pagamento:</strong> ${venda.forma_pagamento_nome}</div>
                <div><strong>Status:</strong> <span class="status-badge status-${venda.status}">${getStatusLabel(venda.status)}</span></div>
                <div><strong>Vendedor:</strong> ${venda.usuario_nome}</div>
            </div>
            
            <h4 style="margin-top: 20px; margin-bottom: 10px;">Itens da Venda</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>Peça</th>
                        <th>Quantidade</th>
                        <th>Valor Unit.</th>
                        <th>Desconto</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${venda.itens
                      .map(
                        (item) => `
                        <tr>
                            <td>${item.peca_nome}</td>
                            <td>${item.quantidade}</td>
                            <td>R$ ${Number.parseFloat(item.valor_unitario).toFixed(2)}</td>
                            <td>R$ ${Number.parseFloat(item.desconto_item || 0).toFixed(2)}</td>
                            <td>R$ ${(item.quantidade * item.valor_unitario - (item.desconto_item || 0)).toFixed(2)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <p><strong>Desconto (${descontoPercentual.toFixed(2)}%):</strong> R$ ${Number.parseFloat(venda.desconto_aplicado || 0).toFixed(2)}</p>
                <p style="font-size: 18px;"><strong>Valor Total:</strong> R$ ${Number.parseFloat(venda.valor_total).toFixed(2)}</p>
            </div>
            
            ${
              venda.observacoes
                ? `
                <div style="margin-top: 15px;">
                    <strong>Observações:</strong>
                    <p>${venda.observacoes}</p>
                </div>
            `
                : ""
            }
        `

    document.getElementById("vendaDetails").innerHTML = detailsHtml

    // Show finalize button only for pending sales
    const finalizarBtn = document.getElementById("finalizarVendaBtn")
    if (venda.status === "pendente") {
      finalizarBtn.style.display = "inline-block"
      finalizarBtn.onclick = () => finalizarVendaDirect(id)
    } else {
      finalizarBtn.style.display = "none"
    }

    document.getElementById("viewVendaModal").style.display = "block"
  } catch (error) {
    console.error("Erro ao visualizar venda:", error)
    alert("Erro ao visualizar venda: " + error.message)
  }
}

async function editVenda(id) {
  if (pecas.length === 0) {
    alert("Carregando peças... Por favor, aguarde um momento e tente novamente.")
    return
  }

  try {
    const response = await window.auth.authenticatedRequest(`/api/vendas/${id}`)
    if (!response.ok) throw new Error("Erro ao carregar venda")

    const result = await response.json()
    const venda = result.data

    if (venda.status !== "pendente") {
      alert("Apenas vendas pendentes podem ser editadas")
      return
    }

    currentVendaId = id
    document.getElementById("vendaModalTitle").textContent = "Editar Venda"
    document.getElementById("vendaId").value = id
    document.getElementById("vendaCliente").value = venda.cliente_id
    document.getElementById("vendaFormaPagamento").value = venda.forma_pagamento_id
    document.getElementById("vendaData").value = venda.data_hora.split("T")[0]

    const subtotal = Number.parseFloat(venda.valor_total) + Number.parseFloat(venda.desconto_aplicado || 0)
    const descontoPercentual = subtotal > 0 ? ((venda.desconto_aplicado || 0) / subtotal) * 100 : 0
    document.getElementById("vendaDesconto").value = descontoPercentual.toFixed(2)

    document.getElementById("vendaObservacoes").value = venda.observacoes || ""

    // Clear and populate items
    document.getElementById("vendaItems").innerHTML = ""
    itemCounter = 0

    venda.itens.forEach((item) => {
      addVendaItem()
      const itemRow = document.getElementById(`item-${itemCounter}`)

      const container = itemRow.querySelector(".searchable-select")
      const input = container.querySelector(".searchable-select-input")
      const hiddenInput = container.querySelector('input[type="hidden"]')

      input.value = item.peca_nome
      hiddenInput.value = item.peca_id

      itemRow.querySelector('input[name="quantidade[]"]').value = item.quantidade
      itemRow.querySelector('input[name="valor_unitario[]"]').value = item.valor_unitario
      itemRow.querySelector('input[name="desconto_item[]"]').value = item.desconto_item || 0
    })

    calculateVendaTotal()
    document.getElementById("vendaModal").style.display = "block"
  } catch (error) {
    console.error("Erro ao editar venda:", error)
    alert("Erro ao editar venda: " + error.message)
  }
}

async function finalizarVendaDirect(id) {
  if (!confirm("Deseja finalizar esta venda? O estoque será atualizado.")) {
    return
  }

  console.log(" === FINALIZANDO VENDA ===")
  console.log(" ID da venda:", id)

  try {
    const response = await window.auth.authenticatedRequest(`/api/vendas/${id}/finalizar`, {
      method: "POST",
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Erro ao finalizar venda")
    }

    console.log(" Venda finalizada com sucesso")
    console.log(" AGORA SIM o estoque foi baixado")

    alert("Venda finalizada com sucesso! O estoque foi atualizado.")
    closeViewVendaModal()
    loadVendas()
    await loadPecas()
    console.log(" === FIM DA FINALIZAÇÃO ===")
  } catch (error) {
    console.error("Erro ao finalizar venda:", error)
    alert("Erro ao finalizar venda: " + error.message)
  }
}

async function cancelarVenda(id) {
  if (!confirm("Deseja cancelar esta venda? Se já foi finalizada, o estoque será revertido.")) {
    return
  }

  try {
    const response = await window.auth.authenticatedRequest(`/api/vendas/${id}/cancelar`, {
      method: "POST",
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Erro ao cancelar venda")
    }

    alert("Venda cancelada com sucesso!")
    loadVendas()
    loadPecas() // Reload to update stock
  } catch (error) {
    console.error("Erro ao cancelar venda:", error)
    alert("Erro ao cancelar venda: " + error.message)
  }
}

// Filter and Search Functions
function filterVendas() {
  const status = document.getElementById("filterStatus").value
  const cliente = selectedClienteId
  const formaPagamento = document.getElementById("filterFormaPagamento").value
  const dataInicio = document.getElementById("filterDataInicio").value
  const dataFim = document.getElementById("filterDataFim").value

  const params = new URLSearchParams()
  if (status) params.append("status", status)
  if (cliente) params.append("cliente_id", cliente)
  if (formaPagamento) params.append("forma_pagamento_id", formaPagamento)
  if (dataInicio) params.append("data_inicio", dataInicio)
  if (dataFim) params.append("data_fim", dataFim)

  window.auth
    .authenticatedRequest(`/api/vendas?${params.toString()}`)
    .then((response) => response.json())
    .then((data) => {
      vendas = data.data || []
      renderVendasTable()
    })
    .catch((error) => {
      console.error("Erro ao filtrar vendas:", error)
    })
}

function populateClienteFilter() {
  const dropdown = document.getElementById("filterClienteDropdown")

  // Keep "Todos os Clientes" option
  const allOption = '<div class="searchable-select-option selected" data-value="">Todos os Clientes</div>'

  const clienteOptions = clientes
    .map((cliente) => `<div class="searchable-select-option" data-value="${cliente.cliente_id}">${cliente.nome}</div>`)
    .join("")

  dropdown.innerHTML = allOption + clienteOptions
}

function clearFilters() {
  document.getElementById("filterStatus").value = ""
  selectedClienteId = ""
  const input = document.getElementById("filterClienteSearch")
  const dropdown = document.getElementById("filterClienteDropdown")
  input.value = "Todos os Clientes"
  dropdown.querySelectorAll(".searchable-select-option").forEach((opt) => {
    opt.classList.remove("selected")
  })
  dropdown.querySelector('[data-value=""]').classList.add("selected")
  document.getElementById("filterFormaPagamento").value = ""
  document.getElementById("filterDataInicio").value = ""
  document.getElementById("filterDataFim").value = ""
  filterVendas()
}

// Export Function
function exportVendas() {
  alert("Funcionalidade de exportação será implementada em breve")
}

// Utility Functions
function formatDate(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleString("pt-BR")
}

function getStatusLabel(status) {
  const labels = {
    pendente: "Pendente",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  }
  return labels[status] || status
}

// Close modals when clicking outside
window.onclick = (event) => {
  const vendaModal = document.getElementById("vendaModal")
  const viewModal = document.getElementById("viewVendaModal")

  if (event.target === vendaModal) {
    closeVendaModal()
  }
  if (event.target === viewModal) {
    closeViewVendaModal()
  }
}

function initSearchableClienteFilter() {
  const input = document.getElementById("filterClienteSearch")
  const dropdown = document.getElementById("filterClienteDropdown")
  const container = document.getElementById("searchableClienteFilter")

  // Toggle dropdown on input click
  input.addEventListener("click", (e) => {
    e.stopPropagation()
    input.removeAttribute("readonly")
    input.focus()
    dropdown.classList.add("active")
  })

  // Filter options as user types
  input.addEventListener("input", () => {
    const searchTerm = input.value.toLowerCase()
    const options = dropdown.querySelectorAll(".searchable-select-option")

    options.forEach((option) => {
      const text = option.textContent.toLowerCase()
      if (text.includes(searchTerm)) {
        option.style.display = "block"
      } else {
        option.style.display = "none"
      }
    })
  })

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdown.classList.remove("active")
      input.setAttribute("readonly", "true")
      // Restore selected value if user didn't select anything
      const selectedOption = dropdown.querySelector(".searchable-select-option.selected")
      if (selectedOption) {
        input.value = selectedOption.textContent
      }
    }
  })

  // Handle option selection
  dropdown.addEventListener("click", (e) => {
    if (e.target.classList.contains("searchable-select-option")) {
      // Remove previous selection
      dropdown.querySelectorAll(".searchable-select-option").forEach((opt) => {
        opt.classList.remove("selected")
      })

      // Set new selection
      e.target.classList.add("selected")
      input.value = e.target.textContent
      selectedClienteId = e.target.dataset.value

      // Close dropdown
      dropdown.classList.remove("active")
      input.setAttribute("readonly", "true")

      // Trigger filter
      filterVendas()
    }
  })
}
// </CHANGE>
