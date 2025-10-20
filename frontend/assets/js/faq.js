// Declare the auth variable before using it
const auth = {
  initialized: false,
  isAuthenticated: () => false,
  getCurrentUser: () => Promise.resolve({}),
  logout: () => {},
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== INICIANDO FAQ ===")

  if (!auth.initialized) {
    setTimeout(async () => {
      await initFAQ()
    }, 500)
  } else {
    await initFAQ()
  }

  async function initFAQ() {
    if (!auth.isAuthenticated()) {
      window.location.href = "/login.html"
      return
    }

    try {
      const userData = await auth.getCurrentUser()
      updateUserInfo(userData)
      buildDynamicMenu(userData.tipo_usuario || "vendedor")
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      buildDynamicMenu("vendedor")
    }

    await loadFAQ()
    setupSearch()
    addLogoutButton()
  }

  async function loadFAQ() {
    try {
      const response = await fetch("/api/faq", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const faqs = await response.json()
        renderFAQ(faqs)
      } else {
        // Load default FAQ if API fails
        renderDefaultFAQ()
      }
    } catch (error) {
      console.error("Erro ao carregar FAQ:", error)
      renderDefaultFAQ()
    }
  }

  function renderFAQ(faqs) {
    const container = document.getElementById("faq-content")

    // Group FAQs by category
    const categories = {}
    faqs.forEach((faq) => {
      if (!categories[faq.categoria]) {
        categories[faq.categoria] = []
      }
      categories[faq.categoria].push(faq)
    })

    let html = ""
    Object.keys(categories).forEach((category) => {
      html += `
                <div class="faq-category" data-category="${category}">
                    <h2 class="category-title">
                        <i class="fas fa-folder"></i>
                        ${category}
                    </h2>
                    ${categories[category]
                      .map(
                        (faq) => `
                        <div class="faq-item" data-question="${faq.pergunta.toLowerCase()}">
                            <div class="faq-question" onclick="toggleFAQ(this)">
                                <h3>${faq.pergunta}</h3>
                                <i class="fas fa-chevron-down faq-toggle"></i>
                            </div>
                            <div class="faq-answer">
                                <p>${faq.resposta}</p>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `
    })

    container.innerHTML = html
  }

  function renderDefaultFAQ() {
    const defaultFAQs = [
      {
        categoria: "Sistema Geral",
        items: [
          {
            pergunta: "Como faço login no sistema?",
            resposta:
              'Para fazer login, acesse a página inicial e insira seu email e senha cadastrados. Se esqueceu sua senha, clique em "Esqueci minha senha" para redefini-la.',
          },
          {
            pergunta: "Como alterar minha senha?",
            resposta:
              'Vá até seu perfil de usuário e clique em "Alterar Senha". Digite sua senha atual e a nova senha duas vezes para confirmar.',
          },
          {
            pergunta: "O que significam os diferentes tipos de usuário?",
            resposta:
              "Admin: acesso completo ao sistema. Vendedor: pode gerenciar vendas e clientes. Estoque: pode gerenciar produtos e fornecedores.",
          },
        ],
      },
      {
        categoria: "Produtos e Estoque",
        items: [
          {
            pergunta: "Como cadastrar um novo produto?",
            resposta:
              'Acesse o menu "Produtos" e clique em "Novo Produto". Preencha todas as informações obrigatórias como nome, categoria, marca, preço e quantidade em estoque.',
          },
          {
            pergunta: "Como funciona o controle de estoque?",
            resposta:
              "O sistema atualiza automaticamente o estoque a cada venda ou compra. Você pode definir um estoque mínimo para receber alertas quando o produto estiver acabando.",
          },
          {
            pergunta: "Posso adicionar imagens aos produtos?",
            resposta:
              "Sim! Ao cadastrar ou editar um produto, você pode fazer upload de até 5 imagens. As imagens ajudam na identificação e apresentação dos produtos.",
          },
        ],
      },
      {
        categoria: "Vendas",
        items: [
          {
            pergunta: "Como registrar uma venda?",
            resposta:
              'Acesse "Vendas" > "Nova Venda". Selecione o cliente, adicione os produtos desejados, escolha a forma de pagamento e finalize a venda.',
          },
          {
            pergunta: "Posso cancelar uma venda?",
            resposta:
              "Sim, vendas podem ser canceladas desde que ainda não tenham sido finalizadas. O estoque será automaticamente restaurado.",
          },
          {
            pergunta: "Como funciona o sistema de trocas?",
            resposta:
              'Acesse "Trocas" para registrar trocas de produtos. Selecione a venda original, o produto a ser trocado e o novo produto. O sistema ajustará automaticamente os valores e estoque.',
          },
        ],
      },
      {
        categoria: "Clientes e Fornecedores",
        items: [
          {
            pergunta: "Como cadastrar um cliente?",
            resposta:
              'Vá em "Clientes" > "Novo Cliente". Preencha os dados pessoais, contato e endereço. Para pessoa jurídica, informe também o CNPJ.',
          },
          {
            pergunta: "Posso ter múltiplos endereços para um cliente?",
            resposta: "Sim! Cada cliente pode ter vários endereços cadastrados para entrega e cobrança.",
          },
          {
            pergunta: "Como gerenciar fornecedores?",
            resposta:
              'Em "Fornecedores" você pode cadastrar e gerenciar todos os seus fornecedores, incluindo dados de contato, produtos fornecidos e histórico de compras.',
          },
        ],
      },
      {
        categoria: "Relatórios",
        items: [
          {
            pergunta: "Que tipos de relatórios posso gerar?",
            resposta:
              "O sistema oferece relatórios de vendas, estoque, produtos mais vendidos, clientes mais ativos e análises financeiras por período.",
          },
          {
            pergunta: "Como exportar relatórios?",
            resposta:
              'Todos os relatórios podem ser exportados em formato PDF ou Excel através do botão "Exportar" na tela de relatórios.',
          },
        ],
      },
    ]

    let html = ""
    defaultFAQs.forEach((category) => {
      html += `
                <div class="faq-category" data-category="${category.categoria}">
                    <h2 class="category-title">
                        <i class="fas fa-folder"></i>
                        ${category.categoria}
                    </h2>
                    ${category.items
                      .map(
                        (item) => `
                        <div class="faq-item" data-question="${item.pergunta.toLowerCase()}">
                            <div class="faq-question" onclick="toggleFAQ(this)">
                                <h3>${item.pergunta}</h3>
                                <i class="fas fa-chevron-down faq-toggle"></i>
                            </div>
                            <div class="faq-answer">
                                <p>${item.resposta}</p>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `
    })

    document.getElementById("faq-content").innerHTML = html
  }

  function setupSearch() {
    const searchInput = document.getElementById("search-faq")
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      const faqItems = document.querySelectorAll(".faq-item")
      const categories = document.querySelectorAll(".faq-category")
      let hasResults = false

      categories.forEach((category) => {
        let categoryHasResults = false
        const items = category.querySelectorAll(".faq-item")

        items.forEach((item) => {
          const question = item.dataset.question
          const answer = item.querySelector(".faq-answer p").textContent.toLowerCase()

          if (question.includes(searchTerm) || answer.includes(searchTerm)) {
            item.style.display = "block"
            categoryHasResults = true
            hasResults = true
          } else {
            item.style.display = "none"
          }
        })

        category.style.display = categoryHasResults ? "block" : "none"
      })

      // Show/hide no results message
      let noResultsMsg = document.querySelector(".no-results")
      if (!hasResults && searchTerm) {
        if (!noResultsMsg) {
          noResultsMsg = document.createElement("div")
          noResultsMsg.className = "no-results"
          noResultsMsg.innerHTML = `
                        <i class="fas fa-search" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                        <h3>Nenhum resultado encontrado</h3>
                        <p>Tente usar palavras-chave diferentes ou entre em contato com o suporte.</p>
                    `
          document.getElementById("faq-content").appendChild(noResultsMsg)
        }
        noResultsMsg.style.display = "block"
      } else if (noResultsMsg) {
        noResultsMsg.style.display = "none"
      }
    })
  }

  // Global function for FAQ toggle
  window.toggleFAQ = (element) => {
    const faqItem = element.parentElement
    const isActive = faqItem.classList.contains("active")

    // Close all other FAQ items
    document.querySelectorAll(".faq-item.active").forEach((item) => {
      if (item !== faqItem) {
        item.classList.remove("active")
      }
    })

    // Toggle current item
    faqItem.classList.toggle("active", !isActive)
  }

  

  function updateUserInfo(user) {
    const userNameEl = document.querySelector(".user-name")
    const userRoleEl = document.querySelector(".user-role")
    if (userNameEl && userRoleEl) {
      userNameEl.textContent = user.nome || "Usuário"
      userRoleEl.textContent = user.tipo_usuario
        ? user.tipo_usuario.charAt(0).toUpperCase() + user.tipo_usuario.slice(1)
        : "Usuário"
    }
  }

  function addLogoutButton() {
    const userInfo = document.querySelector(".user-info")
    if (userInfo && !userInfo.querySelector(".logout-btn")) {
      const logoutBtn = document.createElement("button")
      logoutBtn.className = "logout-btn"
      logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair'
      logoutBtn.onclick = () => auth.logout()
      logoutBtn.style.cssText =
        "margin-top: 10px; padding: 8px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;"
      userInfo.appendChild(logoutBtn)
    }
  }
})
