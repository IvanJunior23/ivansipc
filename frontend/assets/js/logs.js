let currentLogs = []
let currentFilters = {}

// Import necessary functions or declare them before using

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadLogs()
  loadStats()

  // Definir data padrão (últimos 7 dias)
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  document.getElementById("filterDataFim").value = today.toISOString().split("T")[0]
  document.getElementById("filterDataInicio").value = weekAgo.toISOString().split("T")[0]
})

// Carregar logs
async function loadLogs() {
  try {
    showLoading()

    const queryParams = new URLSearchParams()

    // Aplicar filtros
    if (currentFilters.acao) queryParams.append("acao", currentFilters.acao)
    if (currentFilters.data_inicio) queryParams.append("data_inicio", currentFilters.data_inicio)
    if (currentFilters.data_fim) queryParams.append("data_fim", currentFilters.data_fim)
    if (currentFilters.limit) queryParams.append("limit", currentFilters.limit)

    const response = await fetch(`http://localhost:3000/api/logs?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar logs")
    }

    const data = await response.json()
    currentLogs = data.data
    renderLogsTable()
    updateStats()
  } catch (error) {
    console.error("Erro ao carregar logs:", error)
    showError("Erro ao carregar logs: " + error.message)
  }
}

// Renderizar tabela de logs
function renderLogsTable() {
  const tbody = document.getElementById("logsTableBody")

  if (currentLogs.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    Nenhum log encontrado
                </td>
            </tr>
        `
    return
  }

  tbody.innerHTML = currentLogs
    .map(
      (log) => `
        <tr>
            <td>${log.log_id}</td>
            <td>${formatDateTime(log.data_hora)}</td>
            <td>
                ${log.usuario_nome || "Sistema"}
                ${log.usuario_id ? `<small style="display: block; color: #666;">ID: ${log.usuario_id}</small>` : ""}
            </td>
            <td>
                <span class="status-badge ${getActionBadgeClass(log.acao)}">${formatAction(log.acao)}</span>
            </td>
            <td>
                <small style="color: #666;">${log.tabela_afetada || "-"}</small>
            </td>
            <td>
                <small style="color: #666;">${log.registro_id || "-"}</small>
            </td>
            <td>
                <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.detalhes}">
                    ${log.detalhes}
                </div>
            </td>
            <td>
                <small style="color: #666;">${log.ip_origem || "-"}</small>
            </td>
            <td>
                <button class="btn-sm btn-view" onclick="showLogDetails(${log.log_id})" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("")
}

// Aplicar filtros
function applyFilters() {
  currentFilters = {
    acao: document.getElementById("filterAcao").value,
    data_inicio: document.getElementById("filterDataInicio").value,
    data_fim: document.getElementById("filterDataFim").value,
    limit: document.getElementById("filterLimit").value,
  }

  // Remove filtros vazios
  Object.keys(currentFilters).forEach((key) => {
    if (!currentFilters[key]) delete currentFilters[key]
  })

  loadLogs()
}

// Carregar estatísticas
async function loadStats() {
  try {
    const today = new Date().toISOString().split("T")[0]
    const response = await fetch(`http://localhost:3000/api/logs/login/stats?data_inicio=${today}&data_fim=${today}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      const todayStats = data.data[0] || { total_logins: 0, usuarios_unicos: 0 }

      document.getElementById("loginsToday").textContent = todayStats.total_logins
      document.getElementById("uniqueUsers").textContent = todayStats.usuarios_unicos
    }
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error)
  }
}

// Atualizar estatísticas baseadas nos logs carregados
function updateStats() {
  document.getElementById("totalLogs").textContent = currentLogs.length

  if (currentLogs.length > 0) {
    const lastLog = currentLogs[0] // Logs vêm ordenados por data DESC
    document.getElementById("lastActivity").textContent = formatTime(lastLog.data_hora)
  }
}

// Mostrar detalhes do log
async function showLogDetails(logId) {
  try {
    const response = await fetch(`http://localhost:3000/api/logs/${logId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar detalhes do log")
    }

    const data = await response.json()
    const log = data.data

    const modalContent = document.getElementById("logDetailsContent")
    modalContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h6 style="margin-bottom: 10px; color: #2C3E50;">Informações Básicas</h6>
                    <table style="width: 100%; font-size: 14px;">
                        <tr><td style="padding: 5px 0;"><strong>ID:</strong></td><td>${log.log_id}</td></tr>
                        <tr><td style="padding: 5px 0;"><strong>Data/Hora:</strong></td><td>${formatDateTime(log.data_hora)}</td></tr>
                        <tr><td style="padding: 5px 0;"><strong>Usuário:</strong></td><td>${log.usuario_nome || "Sistema"} ${log.usuario_id ? `(ID: ${log.usuario_id})` : ""}</td></tr>
                        <tr><td style="padding: 5px 0;"><strong>Ação:</strong></td><td><span class="status-badge ${getActionBadgeClass(log.acao)}">${formatAction(log.acao)}</span></td></tr>
                        <tr><td style="padding: 5px 0;"><strong>IP:</strong></td><td>${log.ip_origem || "-"}</td></tr>
                    </table>
                </div>
                <div>
                    <h6 style="margin-bottom: 10px; color: #2C3E50;">Detalhes Adicionais</h6>
                    <table style="width: 100%; font-size: 14px;">
                        <tr><td style="padding: 5px 0;"><strong>Tabela Afetada:</strong></td><td>${log.tabela_afetada || "-"}</td></tr>
                        <tr><td style="padding: 5px 0;"><strong>Registro ID:</strong></td><td>${log.registro_id || "-"}</td></tr>
                    </table>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h6 style="margin-bottom: 10px; color: #2C3E50;">Detalhes</h6>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">${log.detalhes}</pre>
                </div>
            </div>
            ${
              log.valores_anteriores || log.valores_novos
                ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                ${
                  log.valores_anteriores
                    ? `
                <div>
                    <h6 style="margin-bottom: 10px; color: #2C3E50;">Valores Anteriores</h6>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <pre style="margin: 0; white-space: pre-wrap; font-size: 11px;">${JSON.stringify(JSON.parse(log.valores_anteriores), null, 2)}</pre>
                    </div>
                </div>
                `
                    : ""
                }
                ${
                  log.valores_novos
                    ? `
                <div>
                    <h6 style="margin-bottom: 10px; color: #2C3E50;">Valores Novos</h6>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <pre style="margin: 0; white-space: pre-wrap; font-size: 11px;">${JSON.stringify(JSON.parse(log.valores_novos), null, 2)}</pre>
                    </div>
                </div>
                `
                    : ""
                }
            </div>
            `
                : ""
            }
        `

    document.getElementById("logDetailsModal").style.display = "block"
  } catch (error) {
    console.error("Erro ao carregar detalhes:", error)
    showError("Erro ao carregar detalhes do log")
  }
}

function closeLogDetailsModal() {
  document.getElementById("logDetailsModal").style.display = "none"
}

// Exportar logs
function exportLogs() {
  if (currentLogs.length === 0) {
    showError("Não há logs para exportar")
    return
  }

  const csvContent = generateCSV(currentLogs)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `logs_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Gerar CSV
function generateCSV(logs) {
  const headers = [
    "ID",
    "Data/Hora",
    "Usuário",
    "Ação",
    "Tabela",
    "Registro ID",
    "Detalhes",
    "IP",
    "Valores Anteriores",
    "Valores Novos",
  ]
  const csvRows = [headers.join(",")]

  logs.forEach((log) => {
    const row = [
      log.log_id,
      `"${formatDateTime(log.data_hora)}"`,
      `"${log.usuario_nome || "Sistema"}"`,
      `"${formatAction(log.acao)}"`,
      `"${log.tabela_afetada || ""}"`,
      log.registro_id || "",
      `"${log.detalhes.replace(/"/g, '""')}"`,
      `"${log.ip_origem || ""}"`,
      `"${log.valores_anteriores ? JSON.stringify(JSON.parse(log.valores_anteriores)) : ""}"`,
      `"${log.valores_novos ? JSON.stringify(JSON.parse(log.valores_novos)) : ""}"`,
    ]
    csvRows.push(row.join(","))
  })

  return csvRows.join("\n")
}

// Funções utilitárias
function formatDateTime(dateTime) {
  return new Date(dateTime).toLocaleString("pt-BR")
}

function formatTime(dateTime) {
  return new Date(dateTime).toLocaleTimeString("pt-BR")
}

function formatAction(action) {
  const actions = {
    LOGIN: "Login",
    LOGOUT: "Logout",
    CREATE_CATEGORIA: "Criar Categoria",
    UPDATE_CATEGORIA: "Atualizar Categoria",
    DELETE_CATEGORIA: "Excluir Categoria",
    CREATE_MARCA: "Criar Marca",
    UPDATE_MARCA: "Atualizar Marca",
    DELETE_MARCA: "Excluir Marca",
    CREATE_PECA: "Criar Peça",
    UPDATE_PECA: "Atualizar Peça",
    DELETE_PECA: "Excluir Peça",
    CREATE_CLIENTE: "Criar Cliente",
    UPDATE_CLIENTE: "Atualizar Cliente",
    DELETE_CLIENTE: "Excluir Cliente",
    CREATE_FORNECEDOR: "Criar Fornecedor",
    UPDATE_FORNECEDOR: "Atualizar Fornecedor",
    DELETE_FORNECEDOR: "Excluir Fornecedor",
    CREATE_VENDA: "Criar Venda",
    UPDATE_VENDA: "Atualizar Venda",
    DELETE_VENDA: "Excluir Venda",
    CANCEL_VENDA: "Cancelar Venda",
    CREATE_COMPRA: "Criar Compra",
    UPDATE_COMPRA: "Atualizar Compra",
    DELETE_COMPRA: "Excluir Compra",
    CREATE_TROCA: "Criar Troca",
    UPDATE_TROCA: "Atualizar Troca",
    DELETE_TROCA: "Excluir Troca",
    AJUSTE_ESTOQUE: "Ajuste de Estoque",
    CREATE_USUARIO: "Criar Usuário",
    UPDATE_USUARIO: "Atualizar Usuário",
    DELETE_USUARIO: "Excluir Usuário",
  }

  return actions[action] || action
}

function getActionBadgeClass(action) {
  const classes = {
    LOGIN: "status-login",
    LOGOUT: "status-logout",
    CREATE_CATEGORIA: "status-create",
    UPDATE_CATEGORIA: "status-update",
    DELETE_CATEGORIA: "status-delete",
    CREATE_MARCA: "status-create",
    UPDATE_MARCA: "status-update",
    DELETE_MARCA: "status-delete",
    CREATE_PECA: "status-create",
    UPDATE_PECA: "status-update",
    DELETE_PECA: "status-delete",
    CREATE_CLIENTE: "status-create",
    UPDATE_CLIENTE: "status-update",
    DELETE_CLIENTE: "status-delete",
    CREATE_FORNECEDOR: "status-create",
    UPDATE_FORNECEDOR: "status-update",
    DELETE_FORNECEDOR: "status-delete",
    CREATE_VENDA: "status-login",
    UPDATE_VENDA: "status-update",
    DELETE_VENDA: "status-delete",
    CANCEL_VENDA: "status-delete",
    CREATE_COMPRA: "status-create",
    UPDATE_COMPRA: "status-update",
    DELETE_COMPRA: "status-delete",
    CREATE_TROCA: "status-update",
    UPDATE_TROCA: "status-update",
    DELETE_TROCA: "status-delete",
    AJUSTE_ESTOQUE: "status-update",
    CREATE_USUARIO: "status-create",
    UPDATE_USUARIO: "status-update",
    DELETE_USUARIO: "status-delete",
  }

  return classes[action] || "status-create"
}

function showLoading() {
  const tbody = document.getElementById("logsTableBody")
  tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #1ABC9C;"></i>
                <p style="margin-top: 10px; color: #666;">Carregando...</p>
            </td>
        </tr>
    `
}

function showError(message) {
  const tbody = document.getElementById("logsTableBody")
  tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 40px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>${message}
            </td>
        </tr>
    `
}

function searchLogs() {
  const searchTerm = document.getElementById("searchLogs").value.toLowerCase()

  if (!searchTerm) {
    renderLogsTable()
    return
  }

  const filteredLogs = currentLogs.filter(
    (log) =>
      log.detalhes.toLowerCase().includes(searchTerm) ||
      (log.usuario_nome && log.usuario_nome.toLowerCase().includes(searchTerm)) ||
      formatAction(log.acao).toLowerCase().includes(searchTerm) ||
      (log.tabela_afetada && log.tabela_afetada.toLowerCase().includes(searchTerm)),
  )

  const tbody = document.getElementById("logsTableBody")

  if (filteredLogs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
          Nenhum resultado encontrado para "${searchTerm}"
        </td>
      </tr>
    `
    return
  }

  // Renderizar logs filtrados usando a mesma lógica
  tbody.innerHTML = filteredLogs
    .map(
      (log) => `
        <tr>
            <td>${log.log_id}</td>
            <td>${formatDateTime(log.data_hora)}</td>
            <td>
                ${log.usuario_nome || "Sistema"}
                ${log.usuario_id ? `<small style="display: block; color: #666;">ID: ${log.usuario_id}</small>` : ""}
            </td>
            <td>
                <span class="status-badge ${getActionBadgeClass(log.acao)}">${formatAction(log.acao)}</span>
            </td>
            <td>
                <small style="color: #666;">${log.tabela_afetada || "-"}</small>
            </td>
            <td>
                <small style="color: #666;">${log.registro_id || "-"}</small>
            </td>
            <td>
                <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.detalhes}">
                    ${log.detalhes}
                </div>
            </td>
            <td>
                <small style="color: #666;">${log.ip_origem || "-"}</small>
            </td>
            <td>
                <button class="btn-sm btn-view" onclick="showLogDetails(${log.log_id})" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("")
}
