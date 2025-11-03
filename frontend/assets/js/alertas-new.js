const currentAlertas = {
  recompra: [],
  estoque: [],
  vendas: [],
  compras: [],
}

let currentTab = "recompra"

document.addEventListener("DOMContentLoaded", () => {
  console.log(" === INICIANDO ALERTAS ===")
  loadAllAlertas()
  loadStats()
})

async function loadAllAlertas() {
  await Promise.all([loadAlertasRecompra(), loadEstoqueBaixo(), loadVendasPendentes(), loadComprasPendentes()])
}

async function loadAlertasRecompra() {
  try {
    console.log(" Carregando alertas de recompra...")
    const response = await fetch("http://localhost:3000/api/alertas/recompra", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    console.log(" Recompra response status:", response.status)

    if (!response.ok) {
      throw new Error("Erro ao carregar alertas de recompra")
    }

    const data = await response.json()
    console.log(" Alertas de recompra:", data)
    currentAlertas.recompra = data.data || []
    renderRecompraTable()
  } catch (error) {
    console.error(" Erro ao carregar alertas de recompra:", error)
    showError("recompraTableBody", "Erro ao carregar alertas de recompra")
  }
}

async function loadEstoqueBaixo() {
  try {
    console.log(" Carregando estoque baixo...")
    const response = await fetch("http://localhost:3000/api/alertas/estoque-baixo", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    console.log(" Estoque response status:", response.status)

    if (!response.ok) {
      throw new Error("Erro ao carregar estoque baixo")
    }

    const data = await response.json()
    console.log(" Estoque baixo:", data)
    currentAlertas.estoque = data.data || []
    renderEstoqueTable()
  } catch (error) {
    console.error(" Erro ao carregar estoque baixo:", error)
    showError("estoqueTableBody", "Erro ao carregar estoque baixo")
  }
}

async function loadVendasPendentes() {
  try {
    console.log(" Carregando vendas pendentes...")
    const response = await fetch("http://localhost:3000/api/alertas/vendas-pendentes", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    console.log(" Vendas response status:", response.status)

    if (!response.ok) {
      throw new Error("Erro ao carregar vendas pendentes")
    }

    const data = await response.json()
    console.log(" Vendas pendentes:", data)
    currentAlertas.vendas = data.data || []
    renderVendasTable()
  } catch (error) {
    console.error(" Erro ao carregar vendas pendentes:", error)
    showError("vendasTableBody", "Erro ao carregar vendas pendentes")
  }
}

async function loadComprasPendentes() {
  try {
    console.log(" Carregando compras pendentes...")
    const response = await fetch("http://localhost:3000/api/alertas/compras-pendentes", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    console.log(" Compras response status:", response.status)

    if (!response.ok) {
      throw new Error("Erro ao carregar compras pendentes")
    }

    const data = await response.json()
    console.log(" Compras pendentes:", data)
    currentAlertas.compras = data.data || []
    renderComprasTable()
  } catch (error) {
    console.error(" Erro ao carregar compras pendentes:", error)
    showError("comprasTableBody", "Erro ao carregar compras pendentes")
  }
}

async function loadStats() {
  try {
    console.log(" Carregando estatísticas...")
    const response = await fetch("http://localhost:3000/api/alertas/stats", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      const result = await response.json()
      const stats = result.data
      console.log(" Estatísticas recebidas:", stats)

      // Atualizar os cards com os valores corretos
      document.getElementById("totalEstoqueBaixo").textContent = stats.estoque_baixo || 0
      document.getElementById("totalRecompra").textContent = stats.recompra || 0
      document.getElementById("totalVendasPendentes").textContent = stats.vendas_pendentes || 0
      document.getElementById("totalComprasPendentes").textContent = stats.compras_pendentes || 0

      console.log(" Cards atualizados com sucesso")
    } else {
      console.error(" Erro ao carregar estatísticas - status:", response.status)
    }
  } catch (error) {
    console.error(" Erro ao carregar estatísticas:", error)
  }
}

function renderRecompraTable() {
  const tbody = document.getElementById("recompraTableBody")

  if (currentAlertas.recompra.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px; display: block; color: #27ae60;"></i>
          Nenhum alerta de recompra no momento
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = currentAlertas.recompra
    .map(
      (alerta) => `
    <tr>
      <td><strong>${alerta.codigo || "-"}</strong></td>
      <td>
        ${alerta.nome}
        ${alerta.descricao ? `<br><small style="color: #666;">${alerta.descricao}</small>` : ""}
      </td>
      <td>
        <span class="status-badge ${alerta.quantidade_estoque === 0 ? "status-critico" : "status-alerta"}">
          ${alerta.quantidade_estoque}
        </span>
      </td>
      <td>${alerta.quantidade_minima}</td>
      <td><strong>${alerta.quantidade_sugerida || alerta.quantidade_minima * 2}</strong></td>
      <td>
        ${alerta.fornecedor_preferencial || "-"}
        ${alerta.fornecedor_telefone ? `<br><small style="color: #666;">${alerta.fornecedor_telefone}</small>` : ""}
      </td>
      <td>R$ ${Number.parseFloat(alerta.ultimo_preco || alerta.preco_custo || 0).toFixed(2)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-sm btn-view" onclick="showRecompraDetails(${alerta.peca_id})" title="Ver detalhes">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-sm btn-action" onclick="criarCompraRapida(${alerta.peca_id})" title="Criar compra">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")
}

function renderEstoqueTable() {
  const tbody = document.getElementById("estoqueTableBody")

  if (currentAlertas.estoque.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px; display: block; color: #27ae60;"></i>
          Nenhum item com estoque baixo
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = currentAlertas.estoque
    .map(
      (alerta) => `
    <tr>
      <td><strong>${alerta.codigo || "-"}</strong></td>
      <td>
        ${alerta.nome}
        ${alerta.descricao ? `<br><small style="color: #666;">${alerta.descricao}</small>` : ""}
      </td>
      <td>${alerta.categoria_nome || "-"}</td>
      <td>${alerta.marca_nome || "-"}</td>
      <td>
        <span class="status-badge ${alerta.quantidade_estoque === 0 ? "status-critico" : "status-alerta"}">
          ${alerta.quantidade_estoque}
        </span>
      </td>
      <td>${alerta.quantidade_minima}</td>
      <td>
        <span class="status-badge ${alerta.quantidade_estoque === 0 ? "status-critico" : "status-alerta"}">
          ${alerta.quantidade_estoque === 0 ? "Crítico" : "Baixo"}
        </span>
      </td>
      <td>
        <button class="btn-sm btn-view" onclick="showEstoqueDetails(${alerta.peca_id})" title="Ver detalhes">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

function renderVendasTable() {
  const tbody = document.getElementById("vendasTableBody")

  if (currentAlertas.vendas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px; display: block; color: #27ae60;"></i>
          Nenhuma venda pendente
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = currentAlertas.vendas
    .map(
      (venda) => `
    <tr>
      <td><strong>#${venda.venda_id}</strong></td>
      <td>${formatDateTime(venda.data_hora)}</td>
      <td>${venda.cliente_nome || "Cliente não informado"}</td>
      <td><strong>R$ ${Number.parseFloat(venda.valor_total).toFixed(2)}</strong></td>
      <td><span class="status-badge status-pendente">Pendente</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-sm btn-view" onclick="verVenda(${venda.venda_id})" title="Ver venda">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-sm btn-action" onclick="finalizarVenda(${venda.venda_id})" title="Finalizar venda">
            <i class="fas fa-check"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")
}

function renderComprasTable() {
  const tbody = document.getElementById("comprasTableBody")

  if (currentAlertas.compras.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-check-circle" style="font-size: 24px; margin-bottom: 10px; display: block; color: #27ae60;"></i>
          Nenhuma compra pendente
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = currentAlertas.compras
    .map(
      (compra) => `
    <tr>
      <td><strong>#${compra.compra_id}</strong></td>
      <td>${formatDateTime(compra.data_compra)}</td>
      <td>${compra.fornecedor_nome || "Fornecedor não informado"}</td>
      <td><strong>R$ ${Number.parseFloat(compra.valor_total).toFixed(2)}</strong></td>
      <td><span class="status-badge status-pendente">Pendente</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-sm btn-view" onclick="verCompra(${compra.compra_id})" title="Ver compra">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-sm btn-action" onclick="receberCompra(${compra.compra_id})" title="Receber compra">
            <i class="fas fa-check"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")
}

function switchTab(tabName) {
  currentTab = tabName

  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"))
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))

  event.target.closest(".tab").classList.add("active")
  document.getElementById(`${tabName}-tab`).classList.add("active")
}

function refreshAlertas() {
  loadAllAlertas()
  loadStats()
}

function showRecompraDetails(pecaId) {
  const alerta = currentAlertas.recompra.find((a) => a.peca_id === pecaId)
  if (!alerta) return

  const modalContent = document.getElementById("detailsContent")
  modalContent.innerHTML = `
    <div style="display: grid; gap: 15px;">
      <div>
        <strong>Código:</strong> ${alerta.codigo || "-"}
      </div>
      <div>
        <strong>Nome:</strong> ${alerta.nome}
      </div>
      <div>
        <strong>Descrição:</strong> ${alerta.descricao || "-"}
      </div>
      <div>
        <strong>Categoria:</strong> ${alerta.categoria_nome || "-"}
      </div>
      <div>
        <strong>Marca:</strong> ${alerta.marca_nome || "-"}
      </div>
      <div>
        <strong>Estoque Atual:</strong> <span class="status-badge ${alerta.quantidade_estoque === 0 ? "status-critico" : "status-alerta"}">${alerta.quantidade_estoque}</span>
      </div>
      <div>
        <strong>Estoque Mínimo:</strong> ${alerta.quantidade_minima}
      </div>
      <div>
        <strong>Quantidade Sugerida:</strong> ${alerta.quantidade_sugerida || alerta.quantidade_minima * 2}
      </div>
      <div>
        <strong>Fornecedor Preferencial:</strong> ${alerta.fornecedor_preferencial || "-"}
      </div>
      ${alerta.fornecedor_telefone ? `<div><strong>Telefone:</strong> ${alerta.fornecedor_telefone}</div>` : ""}
      ${alerta.fornecedor_email ? `<div><strong>Email:</strong> ${alerta.fornecedor_email}</div>` : ""}
      <div>
        <strong>Último Preço:</strong> R$ ${Number.parseFloat(alerta.ultimo_preco || alerta.preco_custo || 0).toFixed(2)}
      </div>
      ${alerta.data_ultima_compra ? `<div><strong>Última Compra:</strong> ${formatDateTime(alerta.data_ultima_compra)}</div>` : ""}
    </div>
  `

  document.getElementById("detailsModal").style.display = "block"
}

function showEstoqueDetails(pecaId) {
  const alerta = currentAlertas.estoque.find((a) => a.peca_id === pecaId)
  if (!alerta) return

  const modalContent = document.getElementById("detailsContent")
  modalContent.innerHTML = `
    <div style="display: grid; gap: 15px;">
      <div>
        <strong>Código:</strong> ${alerta.codigo || "-"}
      </div>
      <div>
        <strong>Nome:</strong> ${alerta.nome}
      </div>
      <div>
        <strong>Descrição:</strong> ${alerta.descricao || "-"}
      </div>
      <div>
        <strong>Categoria:</strong> ${alerta.categoria_nome || "-"}
      </div>
      <div>
        <strong>Marca:</strong> ${alerta.marca_nome || "-"}
      </div>
      <div>
        <strong>Estoque Atual:</strong> <span class="status-badge ${alerta.quantidade_estoque === 0 ? "status-critico" : "status-alerta"}">${alerta.quantidade_estoque}</span>
      </div>
      <div>
        <strong>Estoque Mínimo:</strong> ${alerta.quantidade_minima}
      </div>
      <div>
        <strong>Diferença:</strong> ${alerta.quantidade_estoque - alerta.quantidade_minima}
      </div>
    </div>
  `

  document.getElementById("detailsModal").style.display = "block"
}

function closeDetailsModal() {
  document.getElementById("detailsModal").style.display = "none"
}

function criarCompraRapida(pecaId) {
  window.location.href = `compras.html?peca_id=${pecaId}`
}

function verVenda(vendaId) {
  window.location.href = `vendas.html?venda_id=${vendaId}`
}

function finalizarVenda(vendaId) {
  if (confirm("Deseja finalizar esta venda?")) {
    window.location.href = `vendas.html?venda_id=${vendaId}&action=finalizar`
  }
}

function verCompra(compraId) {
  window.location.href = `compras.html?compra_id=${compraId}`
}

function receberCompra(compraId) {
  if (confirm("Deseja receber esta compra?")) {
    window.location.href = `compras.html?compra_id=${compraId}&action=receber`
  }
}

function formatDateTime(dateTime) {
  return new Date(dateTime).toLocaleString("pt-BR")
}

function showError(tbodyId, message) {
  const tbody = document.getElementById(tbodyId)
  const colspan = tbodyId === "recompraTableBody" || tbodyId === "estoqueTableBody" ? 8 : 6
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}" style="text-align: center; padding: 40px; color: #e74c3c;">
        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>${message}
      </td>
    </tr>
  `
}
