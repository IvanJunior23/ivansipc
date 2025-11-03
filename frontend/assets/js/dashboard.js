document.addEventListener("DOMContentLoaded", () => {
  let isLoading = false
  let auth = {} // Declare the auth variable

  // Função para carregar dados do dashboard
  async function carregarDashboard() {
    if (isLoading) return
    isLoading = true

    try {
      await Promise.all([
        carregarEstatisticas(),
        carregarAtividadesRecentes(),
        carregarEstoqueBaixo(),
        carregarVendasRecentes(),
      ])
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    } finally {
      isLoading = false
    }
  }

  async function carregarEstatisticas() {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      // Fetch real data from multiple endpoints
      const [usuariosRes, pecasRes, vendasRes] = await Promise.all([
        fetch("/api/usuarios", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/pecas", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/vendas/stats", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (usuariosRes.ok) {
        const usuarios = await usuariosRes.json()
        document.getElementById("total-usuarios").textContent = usuarios.data?.length || "0"
      }

      if (pecasRes.ok) {
        const pecas = await pecasRes.json()
        document.getElementById("total-produtos").textContent = pecas.data?.length || "0"
      }

      if (vendasRes.ok) {
        const vendasStats = await vendasRes.json()
        const stats = vendasStats.data || {}
        document.getElementById("total-vendas").textContent = stats.total_vendas_hoje || "0"
        document.getElementById("faturamento-hoje").textContent =
          `R$ ${(stats.faturamento_hoje || 0).toFixed(2).replace(".", ",")}`
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
      // Keep default values on error
    }
  }

  // Carregar atividades recentes
  async function carregarAtividadesRecentes() {
    const container = document.getElementById("atividades-recentes")

    try {
      // Simulação de dados - substitua pela chamada real da API
      const atividades = [
        {
          tipo: "venda",
          titulo: "Nova venda realizada",
          descricao: "Venda #001234 - R$ 150,00",
          tempo: "5 min atrás",
        },
        {
          tipo: "produto",
          titulo: "Produto cadastrado",
          descricao: "Smartphone XYZ adicionado",
          tempo: "1 hora atrás",
        },
        {
          tipo: "usuario",
          titulo: "Novo usuário",
          descricao: "João Silva foi cadastrado",
          tempo: "2 horas atrás",
        },
      ]

      container.innerHTML = atividades
        .map(
          (atividade) => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${getActivityIcon(atividade.tipo)}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${atividade.titulo}</h4>
                        <p>${atividade.descricao} • ${atividade.tempo}</p>
                    </div>
                </div>
            `,
        )
        .join("")
    } catch (error) {
      console.error("Erro ao carregar atividades:", error)
      container.innerHTML = '<p class="text-center">Erro ao carregar atividades</p>'
    }
  }

  async function carregarEstoqueBaixo() {
    const container = document.getElementById("estoque-baixo")

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/alertas/estoque-baixo", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const result = await response.json()
        const produtos = result.data || []

        if (produtos.length === 0) {
          container.innerHTML = '<p class="text-center">Nenhum produto com estoque baixo</p>'
          return
        }

        container.innerHTML = produtos
          .slice(0, 5)
          .map(
            (produto) => `
                    <div class="estoque-item">
                        <div class="estoque-info">
                            <h4>${produto.nome}</h4>
                            <p>${produto.categoria_nome || "Sem categoria"}</p>
                        </div>
                        <div class="estoque-quantidade ${produto.quantidade_estoque === 0 ? "zero" : ""}">${produto.quantidade_estoque}</div>
                    </div>
                `,
          )
          .join("")
      } else {
        container.innerHTML = '<p class="text-center">Erro ao carregar dados</p>'
      }
    } catch (error) {
      console.error("Erro ao carregar estoque baixo:", error)
      container.innerHTML = '<p class="text-center">Erro ao carregar dados</p>'
    }
  }

  async function carregarVendasRecentes() {
    const container = document.getElementById("vendas-recentes")

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/vendas?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const result = await response.json()
        const vendas = result.data || []

        if (vendas.length === 0) {
          container.innerHTML = '<p class="text-center">Nenhuma venda encontrada</p>'
          return
        }

        container.innerHTML = `
                    <table class="vendas-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vendas
                              .map(
                                (venda) => `
                                <tr>
                                    <td>#${String(venda.id).padStart(6, "0")}</td>
                                    <td>${venda.cliente_nome || "Cliente não identificado"}</td>
                                    <td>R$ ${(venda.valor_total || 0).toFixed(2).replace(".", ",")}</td>
                                    <td><span class="status-badge ${venda.status}">${getStatusLabel(venda.status)}</span></td>
                                    <td>${formatarData(venda.data_hora)}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                `
      } else {
        container.innerHTML = '<p class="text-center">Erro ao carregar vendas</p>'
      }
    } catch (error) {
      console.error("Erro ao carregar vendas recentes:", error)
      container.innerHTML = '<p class="text-center">Erro ao carregar vendas</p>'
    }
  }

  // Funções auxiliares
  function getActivityIcon(tipo) {
    switch (tipo) {
      case "venda":
        return "shopping-cart"
      case "produto":
        return "box"
      case "usuario":
        return "user"
      default:
        return "bell"
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "pendente":
        return "Pendente"
      case "finalizada":
        return "Finalizada"
      case "cancelada":
        return "Cancelada"
      default:
        return status
    }
  }

  function formatarData(dataString) {
    const data = new Date(dataString)
    return (
      data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    )
  }

  // Inicialização
  function init() {
    try {
      carregarDashboard()
    } catch (error) {
      console.error("Erro na inicialização do dashboard:", error)
    }
  }

  // Aguardar auth estar disponível
  if (typeof window.auth !== "undefined" && window.auth.user) {
    auth = window.auth // Assign the auth variable from window
    init()
  } else {
    setTimeout(init, 500)
  }

  // Recarregar dados a cada 5 minutos
  setInterval(carregarDashboard, 5 * 60 * 1000)
})
