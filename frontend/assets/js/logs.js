let currentLogs = []
let currentFilters = {}

// Import necessary functions or declare them before using

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadUsers()
  loadLogs()
  loadStats()

  // Definir data padrão (últimos 7 dias)
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  document.getElementById("filterDataFim").value = today.toISOString().split("T")[0]
  document.getElementById("filterDataInicio").value = weekAgo.toISOString().split("T")[0]
})

async function loadUsers() {
  try {
    const response = await fetch("http://localhost:3000/api/usuarios", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar usuários")
    }

    const data = await response.json()
    const users = data.data || []

    const filterUsuario = document.getElementById("filterUsuario")

    // Add users to dropdown
    users.forEach((user) => {
      const option = document.createElement("option")
      option.value = user.usuario_id
      option.textContent = user.nome || `Usuário ${user.usuario_id}`
      filterUsuario.appendChild(option)
    })
  } catch (error) {
    console.error("Erro ao carregar usuários:", error)
  }
}

// Carregar logs
async function loadLogs() {
  try {
    showLoading()

    const queryParams = new URLSearchParams()

    // Aplicar filtros
    if (currentFilters.acao) queryParams.append("acao", currentFilters.acao)
    if (currentFilters.usuario_id) queryParams.append("usuario_id", currentFilters.usuario_id)
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
  console.log(" applyFilters chamado")

  currentFilters = {
    acao: document.getElementById("filterAcao").value,
    usuario_id: document.getElementById("filterUsuario").value,
    data_inicio: document.getElementById("filterDataInicio").value,
    data_fim: document.getElementById("filterDataFim").value,
    limit: document.getElementById("filterLimit").value,
  }

  console.log(" Filtros antes de limpar:", currentFilters)

  // Remove filtros vazios
  Object.keys(currentFilters).forEach((key) => {
    if (!currentFilters[key]) delete currentFilters[key]
  })

  console.log(" Filtros após limpar:", currentFilters)

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

    let valoresAnterioresHTML = ""
    let valoresNovosHTML = ""

    if (log.valores_anteriores) {
      valoresAnterioresHTML = `
        <div style="margin-top: 20px;">
          <h6 style="margin-bottom: 12px; color: #2C3E50; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-history" style="color: #e74c3c;"></i>
            Valores Anteriores
          </h6>
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${formatJsonAsFields(log.valores_anteriores)}
          </div>
        </div>
      `
    }

    if (log.valores_novos) {
      valoresNovosHTML = `
        <div style="margin-top: 20px;">
          <h6 style="margin-bottom: 12px; color: #2C3E50; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-check-circle" style="color: #28a745;"></i>
            Valores Novos
          </h6>
          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${formatJsonAsFields(log.valores_novos)}
          </div>
        </div>
      `
    }

    const modalContent = document.getElementById("logDetailsContent")
    modalContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                    <h6 style="margin-bottom: 15px; color: #2C3E50; font-weight: 600; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #1ABC9C; padding-bottom: 8px;">
                        <i class="fas fa-info-circle" style="color: #1ABC9C;"></i>
                        Informações Básicas
                    </h6>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px 0; color: #6c757d; font-weight: 500;"><i class="fas fa-hashtag" style="width: 20px;"></i> ID:</td>
                            <td style="padding: 8px 0; font-weight: 600;">${log.log_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6c757d; font-weight: 500;"><i class="fas fa-calendar-alt" style="width: 20px;"></i> Data/Hora:</td>
                            <td style="padding: 8px 0;">${formatDateTime(log.data_hora)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6c757d; font-weight: 500;"><i class="fas fa-user" style="width: 20px;"></i> Usuário:</td>
                            <td style="padding: 8px 0;">${log.usuario_nome || "Sistema"} ${log.usuario_id ? `<span style="color: #6c757d; font-size: 12px;">(ID: ${log.usuario_id})</span>` : ""}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6c757d; font-weight: 500;"><i class="fas fa-bolt" style="width: 20px;"></i> Ação:</td>
                            <td style="padding: 8px 0;"><span class="status-badge ${getActionBadgeClass(log.acao)}">${formatAction(log.acao)}</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6c757d; font-weight: 500;"><i class="fas fa-network-wired" style="width: 20px;"></i> IP:</td>
                            <td style="padding: 8px 0; font-family: monospace;">${log.ip_origem || "-"}</td>
                        </tr>
                    </table>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                    <h6 style="margin-bottom: 15px; color: #2C3E50; font-weight: 600; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
                        <i class="fas fa-database" style="color: #3498db;"></i>
                        Detalhes Adicionais
                    </h6>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 8px 0; color: #6c757d; font-weight: 500;"><i class="fas fa-table" style="width: 20px;"></i> Tabela:</td>
                            <td style="padding: 8px 0; font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px;">${log.tabela_afetada || "-"}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6c757d; font-weight: 500;"><i class="fas fa-key" style="width: 20px;"></i> Registro ID:</td>
                            <td style="padding: 8px 0; font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px;">${log.registro_id || "-"}</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h6 style="margin-bottom: 12px; color: #2C3E50; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-file-alt" style="color: #6c757d;"></i>
                    Detalhes da Operação
                </h6>
                <div style="background: #e9ecef; padding: 15px; border-radius: 5px; border-left: 4px solid #6c757d;">
                    <pre style="margin: 0; white-space: pre-wrap; font-size: 13px; color: #495057; line-height: 1.6;">${log.detalhes}</pre>
                </div>
            </div>
            ${valoresAnterioresHTML}
            ${valoresNovosHTML}
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

function formatJsonAsFields(jsonData) {
  if (!jsonData) return '<p style="color: #999; font-style: italic;">Nenhum dado disponível</p>'

  try {
    const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData

    const fieldLabels = {
      nome: "Nome",
      nome_completo: "Nome Completo",
      email: "E-mail",
      telefone: "Telefone",
      cpf: "CPF",
      cnpj: "CNPJ",
      status: "Status",
      tipo_usuario: "Tipo de Usuário",
      logradouro: "Logradouro",
      numero: "Número",
      complemento: "Complemento",
      bairro: "Bairro",
      cidade: "Cidade",
      estado: "Estado",
      cep: "CEP",
      descricao: "Descrição",
      preco_custo: "Preço de Custo",
      preco_venda: "Preço de Venda",
      quantidade_estoque: "Quantidade em Estoque",
      estoque_minimo: "Estoque Mínimo",
      categoria_id: "ID da Categoria",
      marca_id: "ID da Marca",
      fornecedor_id: "ID do Fornecedor",
      imagem_url: "URL da Imagem",
      codigo_barras: "Código de Barras",
      modelo: "Modelo",
      especificacoes: "Especificações",
      garantia_meses: "Garantia (meses)",
      peso: "Peso",
      dimensoes: "Dimensões",
      cor: "Cor",
      voltagem: "Voltagem",
      potencia: "Potência",
      observacoes: "Observações",
    }

    const formatValue = (key, value) => {
      if (value === null || value === undefined) return "-"
      if (key === "status") return value ? "Ativo" : "Inativo"
      if (key.includes("preco") || key.includes("custo") || key.includes("venda")) {
        return `R$ ${Number.parseFloat(value).toFixed(2)}`
      }
      if (typeof value === "boolean") return value ? "Sim" : "Não"
      if (typeof value === "object") return JSON.stringify(value)
      return value
    }

    const fields = Object.entries(data)
      .map(([key, value]) => {
        const label = fieldLabels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
        const formattedValue = formatValue(key, value)

        return `
        <div style="display: flex; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
          <div style="flex: 0 0 200px; font-weight: 600; color: #495057;">
            ${label}:
          </div>
          <div style="flex: 1; color: #212529;">
            ${formattedValue}
          </div>
        </div>
      `
      })
      .join("")

    return fields
  } catch (error) {
    console.error("Erro ao formatar JSON:", error)
    return `<pre style="margin: 0; white-space: pre-wrap; font-size: 12px; color: #666;">${jsonData}</pre>`
  }
}
