let trocas = []
let vendas = []
let currentTrocaId = null

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  if (window.auth && window.auth.initialized) {
    initTrocasPage()
  } else {
    setTimeout(initTrocasPage, 500)
  }
})

function initTrocasPage() {
  console.log(" Inicializando página de trocas")
  loadTrocas()
  loadVendas()

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0]
  const dataInput = document.getElementById("trocaData")
  if (dataInput) {
    dataInput.value = today
  }
}

async function loadTrocas() {
  try {
    console.log(" Carregando trocas...")
    const response = await window.auth.makeAuthenticatedRequest("/api/trocas")
    const data = await response.json()
    console.log(" Dados de trocas:", data)

    if (data.success) {
      trocas = data.trocas || []
      console.log(" Trocas carregadas:", trocas.length)
      renderTrocasTable()
    } else {
      console.error("Erro ao carregar trocas:", data.message)
      showToast("Erro ao carregar trocas", "error")
    }
  } catch (error) {
    console.error("Erro ao carregar trocas:", error)
    showToast("Erro ao carregar trocas", "error")
  }
}

async function loadVendas() {
  try {
    console.log(" Carregando vendas...")
    const response = await window.auth.makeAuthenticatedRequest("/api/vendas")
    const data = await response.json()
    console.log(" Dados de vendas:", data)

    if (data.success) {
      vendas = (data.vendas || []).filter((v) => v.status === "concluida")
      console.log(" Vendas concluídas carregadas:", vendas.length)
      populateVendaSelect()
    } else {
      console.error("Erro ao carregar vendas:", data.message)
    }
  } catch (error) {
    console.error("Erro ao carregar vendas:", error)
  }
}

// Render Functions
function renderTrocasTable() {
  const tbody = document.getElementById("trocasTableBody")

  if (!tbody) {
    console.error(" Elemento trocasTableBody não encontrado")
    return
  }

  if (trocas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma troca encontrada</td></tr>'
    return
  }

  tbody.innerHTML = trocas
    .map(
      (troca) => `
        <tr>
            <td>${troca.troca_id || troca.id}</td>
            <td>${formatDate(troca.data_troca)}</td>
            <td>Venda #${troca.venda_id}</td>
            <td>${troca.cliente_nome || "N/A"}</td>
            <td>${troca.motivo_troca || troca.motivo || "N/A"}</td>
            <td><span class="status-badge status-${troca.status}">${getStatusLabel(troca.status)}</span></td>
            <td>
                <button class="btn-view" onclick="viewTroca(${troca.troca_id || troca.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                ${
                  troca.status === "pendente"
                    ? `
                    <button class="btn-success" onclick="aprovarTroca(${troca.troca_id || troca.id})" title="Aprovar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-danger" onclick="rejeitarTroca(${troca.troca_id || troca.id})" title="Rejeitar">
                        <i class="fas fa-times"></i>
                    </button>
                `
                    : ""
                }
            </td>
        </tr>
    `,
    )
    .join("")
}

function populateVendaSelect() {
  const select = document.getElementById("trocaVendaOriginal")

  if (!select) {
    console.error(" Elemento trocaVendaOriginal não encontrado")
    return
  }

  console.log(" Populando select de vendas com", vendas.length, "vendas")

  const options = vendas
    .map((venda) => {
      const vendaId = venda.venda_id || venda.id
      const clienteNome = venda.cliente_nome || "Cliente não informado"
      const dataVenda = formatDate(venda.data_hora || venda.data_venda)
      const valorTotal = venda.valor_total ? `R$ ${Number.parseFloat(venda.valor_total).toFixed(2)}` : ""

      return `<option value="${vendaId}">Venda #${vendaId} - ${clienteNome} - ${dataVenda} ${valorTotal}</option>`
    })
    .join("")

  select.innerHTML = '<option value="">Selecione a venda</option>' + options
  console.log(" Select de vendas populado com sucesso")
}

// Modal Functions
function showAddTrocaModal() {
  currentTrocaId = null
  document.getElementById("trocaModalTitle").textContent = "Nova Troca"
  document.getElementById("trocaForm").reset()
  document.getElementById("trocaId").value = ""
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("trocaData").value = today
  document.getElementById("vendaOriginalDetails").style.display = "none"
  document.getElementById("trocaModal").style.display = "block"

  loadVendas()
}

function closeTrocaModal() {
  document.getElementById("trocaModal").style.display = "none"
}

function closeViewTrocaModal() {
  document.getElementById("viewTrocaModal").style.display = "none"
  currentTrocaId = null
}

async function saveTrocaForm(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const trocaId = document.getElementById("trocaId").value

  const trocaData = {
    venda_id: Number.parseInt(formData.get("venda_id")),
    data_troca: formData.get("data_troca"),
    motivo: formData.get("motivo"),
    descricao: formData.get("descricao"),
  }

  console.log(" Salvando troca:", trocaData)

  try {
    const url = trocaId ? `/api/trocas/${trocaId}` : "/api/trocas"
    const method = trocaId ? "PUT" : "POST"

    const data = await window.auth.makeAuthenticatedRequest(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trocaData),
    })

    console.log(" Resposta ao salvar troca:", data)

    if (data.success) {
      showToast(trocaId ? "Troca atualizada com sucesso!" : "Troca criada com sucesso!", "success")
      closeTrocaModal()
      loadTrocas()
    } else {
      showToast(data.message || "Erro ao salvar troca", "error")
    }
  } catch (error) {
    console.error("Erro ao salvar troca:", error)
    showToast("Erro ao salvar troca", "error")
  }
}

async function viewTroca(id) {
  try {
    console.log(" Visualizando troca:", id)
    const data = await window.auth.makeAuthenticatedRequest(`/api/trocas/${id}`)

    if (!data.success) {
      throw new Error(data.message || "Erro ao carregar troca")
    }

    const troca = data.troca

    const detailsHtml = `
      <div class="sale-details">
        <h4>Informações da Troca</h4>
        <p><strong>ID:</strong> ${troca.troca_id || troca.id}</p>
        <p><strong>Data:</strong> ${formatDate(troca.data_troca)}</p>
        <p><strong>Venda Original:</strong> #${troca.venda_id}</p>
        <p><strong>Cliente:</strong> ${troca.cliente_nome || "N/A"}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${troca.status}">${getStatusLabel(troca.status)}</span></p>
        <p><strong>Motivo:</strong> ${troca.motivo || "N/A"}</p>
        <p><strong>Descrição:</strong> ${troca.descricao || troca.motivo_troca || "N/A"}</p>
        ${
          troca.motivo_rejeicao
            ? `
          <div style="margin-top: 15px; padding: 10px; background-color: #f8d7da; border-radius: 5px;">
            <strong>Motivo da Rejeição:</strong>
            <p>${troca.motivo_rejeicao}</p>
          </div>
        `
            : ""
        }
      </div>
    `

    document.getElementById("trocaDetails").innerHTML = detailsHtml

    // Show action buttons only for pending exchanges
    const aprovarBtn = document.getElementById("aprovarTrocaBtn")
    const rejeitarBtn = document.getElementById("rejeitarTrocaBtn")

    if (troca.status === "pendente") {
      currentTrocaId = id
      aprovarBtn.style.display = "inline-block"
      rejeitarBtn.style.display = "inline-block"
    } else {
      aprovarBtn.style.display = "none"
      rejeitarBtn.style.display = "none"
    }

    document.getElementById("viewTrocaModal").style.display = "block"
  } catch (error) {
    console.error("Erro ao visualizar troca:", error)
    showToast("Erro ao visualizar troca", "error")
  }
}

async function aprovarTroca(id) {
  if (!id && currentTrocaId) {
    id = currentTrocaId
  }

  if (!confirm("Deseja aprovar esta troca? O estoque será atualizado.")) {
    return
  }

  try {
    console.log(" Aprovando troca:", id)
    const data = await window.auth.makeAuthenticatedRequest(`/api/trocas/${id}/aprovar`, {
      method: "POST",
    })

    if (data.success) {
      showToast("Troca aprovada com sucesso!", "success")
      closeViewTrocaModal()
      loadTrocas()
    } else {
      showToast(data.message || "Erro ao aprovar troca", "error")
    }
  } catch (error) {
    console.error("Erro ao aprovar troca:", error)
    showToast("Erro ao aprovar troca", "error")
  }
}

async function rejeitarTroca(id) {
  if (!id && currentTrocaId) {
    id = currentTrocaId
  }

  const motivo = prompt("Informe o motivo da rejeição:")
  if (!motivo) return

  try {
    console.log(" Rejeitando troca:", id)
    const data = await window.auth.makeAuthenticatedRequest(`/api/trocas/${id}/rejeitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    })

    if (data.success) {
      showToast("Troca rejeitada com sucesso!", "success")
      closeViewTrocaModal()
      loadTrocas()
    } else {
      showToast(data.message || "Erro ao rejeitar troca", "error")
    }
  } catch (error) {
    console.error("Erro ao rejeitar troca:", error)
    showToast("Erro ao rejeitar troca", "error")
  }
}

async function loadVendaDetails() {
  const vendaId = document.getElementById("trocaVendaOriginal").value
  if (!vendaId) {
    document.getElementById("vendaOriginalDetails").style.display = "none"
    return
  }

  try {
    console.log(" Carregando detalhes da venda:", vendaId)
    const data = await window.auth.makeAuthenticatedRequest(`/api/vendas/${vendaId}`)

    if (!data.success) {
      throw new Error("Erro ao carregar venda")
    }

    const venda = data.venda

    let detailsHtml = `
      <p><strong>Cliente:</strong> ${venda.cliente_nome}</p>
      <p><strong>Data:</strong> ${formatDate(venda.data_hora)}</p>
      <p><strong>Total:</strong> R$ ${Number.parseFloat(venda.valor_total).toFixed(2)}</p>
      <p><strong>Status:</strong> ${venda.status}</p>
    `

    if (venda.itens && venda.itens.length > 0) {
      detailsHtml += "<p><strong>Itens:</strong></p><ul>"
      venda.itens.forEach((item) => {
        detailsHtml += `<li>${item.peca_nome} - Qtd: ${item.quantidade} - R$ ${Number.parseFloat(item.preco_unitario).toFixed(2)}</li>`
      })
      detailsHtml += "</ul>"
    }

    document.getElementById("vendaOriginalInfo").innerHTML = detailsHtml
    document.getElementById("vendaOriginalDetails").style.display = "block"
  } catch (error) {
    console.error("Erro ao carregar detalhes da venda:", error)
    showToast("Erro ao carregar detalhes da venda", "error")
  }
}

// Filter and Search Functions
function filterTrocas() {
  const status = document.getElementById("filterStatus").value
  const dataInicio = document.getElementById("filterDataInicio").value
  const dataFim = document.getElementById("filterDataFim").value

  const params = new URLSearchParams()
  if (status) params.append("status", status)
  if (dataInicio) params.append("data_inicio", dataInicio)
  if (dataFim) params.append("data_fim", dataFim)

  console.log(" Filtrando trocas:", params.toString())

  window.auth
    .makeAuthenticatedRequest(`/api/trocas?${params.toString()}`)
    .then((data) => {
      if (data.success) {
        trocas = data.trocas || []
        renderTrocasTable()
      }
    })
    .catch((error) => {
      console.error("Erro ao filtrar trocas:", error)
    })
}

function searchTrocas() {
  const searchTerm = document.getElementById("searchTroca").value.toLowerCase()

  if (!searchTerm) {
    loadTrocas()
    return
  }

  const filtered = trocas.filter(
    (troca) =>
      (troca.troca_id || troca.id).toString().includes(searchTerm) ||
      (troca.cliente_nome && troca.cliente_nome.toLowerCase().includes(searchTerm)) ||
      (troca.motivo_troca && troca.motivo_troca.toLowerCase().includes(searchTerm)) ||
      (troca.motivo && troca.motivo.toLowerCase().includes(searchTerm)),
  )

  const tbody = document.getElementById("trocasTableBody")
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma troca encontrada</td></tr>'
    return
  }

  tbody.innerHTML = filtered
    .map(
      (troca) => `
        <tr>
            <td>${troca.troca_id || troca.id}</td>
            <td>${formatDate(troca.data_troca)}</td>
            <td>Venda #${troca.venda_id}</td>
            <td>${troca.cliente_nome || "N/A"}</td>
            <td>${troca.motivo_troca || troca.motivo || "N/A"}</td>
            <td><span class="status-badge status-${troca.status}">${getStatusLabel(troca.status)}</span></td>
            <td>
                <button class="btn-view" onclick="viewTroca(${troca.troca_id || troca.id})" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                ${
                  troca.status === "pendente"
                    ? `
                    <button class="btn-success" onclick="aprovarTroca(${troca.troca_id || troca.id})" title="Aprovar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-danger" onclick="rejeitarTroca(${troca.troca_id || troca.id})" title="Rejeitar">
                        <i class="fas fa-times"></i>
                    </button>
                `
                    : ""
                }
            </td>
        </tr>
    `,
    )
    .join("")
}

// Export Function
function exportTrocas() {
  showToast("Funcionalidade de exportação será implementada em breve", "info")
}

// Utility Functions
function formatDate(dateString) {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

function getStatusLabel(status) {
  const labels = {
    pendente: "Pendente",
    aprovada: "Aprovada",
    rejeitada: "Rejeitada",
  }
  return labels[status] || status
}

function showToast(message, type) {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

window.showAddTrocaModal = showAddTrocaModal
window.closeTrocaModal = closeTrocaModal
window.closeViewTrocaModal = closeViewTrocaModal
window.saveTrocaForm = saveTrocaForm
window.viewTroca = viewTroca
window.aprovarTroca = aprovarTroca
window.rejeitarTroca = rejeitarTroca
window.loadVendaDetails = loadVendaDetails
window.filterTrocas = filterTrocas
window.searchTrocas = searchTrocas
window.exportTrocas = exportTrocas

// Close modals when clicking outside
window.onclick = (event) => {
  const trocaModal = document.getElementById("trocaModal")
  const viewModal = document.getElementById("viewTrocaModal")

  if (event.target === trocaModal) {
    closeTrocaModal()
  }
  if (event.target === viewModal) {
    closeViewTrocaModal()
  }
}
