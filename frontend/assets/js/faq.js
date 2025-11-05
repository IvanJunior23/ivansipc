document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Inicializando FAQ")
  renderDefaultFAQ()
  setupSearch()
})

function renderDefaultFAQ() {
  const defaultFAQs = [
    {
      categoria: "Primeiros Passos",
      items: [
        {
          pergunta: "Como faço login no sistema SIPC?",
          resposta:
            'Para fazer login, acesse a página inicial e insira seu email e senha cadastrados pelo administrador. Se esqueceu sua senha, clique em "Esqueci minha senha" ou entre em contato com o administrador do sistema.',
        },
        {
          pergunta: "Como alterar minha senha?",
          resposta:
            'Clique no botão "Alterar Senha" localizado na pagina de login, abaixo das suas informações de usuário. Digite sua senha atual e a nova senha duas vezes para confirmar. A senha deve ter no mínimo 6 caracteres.',
        },
        {
          pergunta: "Quais são os tipos de usuário e suas permissões?",
          resposta:
            "<strong>Admin:</strong> Acesso completo ao sistema, pode gerenciar usuários, configurações e todas as funcionalidades.<br><strong>Vendedor:</strong> Pode gerenciar vendas, clientes, visualizar produtos e gerar relatórios de vendas.<br><strong>Estoque:</strong> Pode gerenciar produtos, fornecedores, compras e controlar o estoque.",
        },
        {
          pergunta: "Como navegar pelo sistema?",
          resposta:
            "Use o menu lateral esquerdo para acessar as diferentes seções do sistema. O Dashboard mostra um resumo geral. Cada seção tem suas próprias funcionalidades de cadastro, listagem e relatórios.",
        },
      ],
    },
    {
      categoria: "Gestão de Peças e Produtos",
      items: [
        {
          pergunta: "Como cadastrar uma nova peça?",
          resposta:
            'Acesse "Peças" no menu lateral e clique em "Nova Peça". Preencha os campos obrigatórios: nome, categoria, marca, preço de venda, preço de custo e quantidade em estoque. Você também pode definir um estoque mínimo para receber alertas automáticos.',
        },
        {
          pergunta: "Como adicionar imagens às peças?",
          resposta:
            'Ao cadastrar ou editar uma peça, clique em "Adicionar Imagem" e selecione as imagens do seu computador. As imagens ajudam na identificação visual dos produtos e aparecem nas vendas.',
        },
        {
          pergunta: "O que é estoque mínimo e como funciona?",
          resposta:
            "O estoque mínimo é a quantidade mínima que você deseja manter de cada peça. Quando o estoque fica abaixo desse valor, o sistema gera um alerta automático no Dashboard para que você possa fazer uma nova compra do fornecedor.",
        },
        {
          pergunta: "Como desativar uma peça?",
          resposta:
            "Na listagem de peças, clique no botão de status (ícone de olho) ao lado da peça. Peças inativas não aparecem no formulário de vendas, mas continuam no sistema para consultas e relatórios históricos.",
        },
        {
          pergunta: "Como funciona o histórico de preços?",
          resposta:
            "O sistema registra automaticamente todas as alterações de preço das peças. Você pode visualizar o histórico completo na tela de detalhes da peça, incluindo data da alteração e preço anterior.",
        },
        {
          pergunta: "Posso editar o estoque manualmente?",
          resposta:
            "Sim, você pode editar a quantidade em estoque ao editar uma peça. No entanto, recomendamos usar as funcionalidades de Compras e Vendas para que o sistema mantenha um histórico preciso de todas as movimentações.",
        },
      ],
    },
    {
      categoria: "Gestão de Clientes",
      items: [
        {
          pergunta: "Como cadastrar um novo cliente?",
          resposta:
            'Acesse "Clientes" e clique em "Novo Cliente". Preencha os dados pessoais, contato e endereço. Para pessoa jurídica, informe também o CNPJ e razão social.',
        },
        {
          pergunta: "Qual a diferença entre CPF e CNPJ no cadastro?",
          resposta:
            "<strong>Pessoa Física (CPF):</strong> Para clientes individuais. Informe nome completo e CPF.<br><strong>Pessoa Jurídica (CNPJ):</strong> Para empresas. Informe razão social, nome fantasia e CNPJ.",
        },
        {
          pergunta: "Posso cadastrar múltiplos endereços para um cliente?",
          resposta:
            "Sim! Cada cliente pode ter vários endereços cadastrados. Isso é útil para clientes que têm endereços diferentes para entrega e cobrança, ou múltiplos pontos de entrega.",
        },
        {
          pergunta: "Como buscar um cliente rapidamente?",
          resposta:
            "Use a barra de pesquisa na tela de clientes. Você pode buscar por nome, CPF, CNPJ, telefone ou email. O sistema filtra os resultados em tempo real conforme você digita.",
        },
      ],
    },
    {
      categoria: "Gestão de Fornecedores",
      items: [
        {
          pergunta: "Como cadastrar um fornecedor?",
          resposta:
            'Acesse "Fornecedores" e clique em "Novo Fornecedor". Preencha os dados da empresa (razão social, CNPJ), informações de contato (telefone, email) e endereço completo.',
        },
        {
          pergunta: "Como vincular peças a um fornecedor?",
          resposta:
            "Ao cadastrar ou editar uma peça, selecione o fornecedor no campo correspondente. Isso permite filtrar peças por fornecedor e facilita o processo de compras.",
        },
        {
          pergunta: "Posso ver o histórico de compras de um fornecedor?",
          resposta:
            "Sim! Na tela de detalhes do fornecedor, você pode visualizar todas as compras realizadas, incluindo datas, valores e produtos adquiridos.",
        },
      ],
    },
    {
      categoria: "Compras e Entrada de Estoque",
      items: [
        {
          pergunta: "Como registrar uma compra de fornecedor?",
          resposta:
            'Acesse "Compras" e clique em "Nova Compra". Selecione o fornecedor, adicione as peças compradas com quantidade e preço unitário. O sistema calculará automaticamente o valor total.',
        },
        {
          pergunta: "O que acontece com o estoque ao registrar uma compra?",
          resposta:
            'Ao finalizar/receber uma compra, o sistema adiciona automaticamente as quantidades compradas ao estoque de cada peça. O status da compra muda de "pendente" para "recebida".',
        },
        {
          pergunta: "Posso cancelar uma compra?",
          resposta:
            "Sim! Compras podem ser canceladas. Se a compra já foi recebida (estoque já foi adicionado), o sistema reverterá automaticamente as quantidades do estoque ao cancelar.",
        },
        {
          pergunta: "Como funciona o status das compras?",
          resposta:
            "<strong>Pendente:</strong> Compra registrada mas ainda não recebida.<br><strong>Recebida:</strong> Mercadoria recebida e estoque atualizado.<br><strong>Cancelada:</strong> Compra cancelada, estoque revertido se necessário.",
        },
      ],
    },
    {
      categoria: "Vendas",
      items: [
        {
          pergunta: "Como registrar uma venda?",
          resposta:
            'Acesse "Vendas" e clique em "Nova Venda". Selecione o cliente, adicione as peças desejadas (use a busca para encontrar rapidamente), informe quantidade e desconto se houver. Escolha a forma de pagamento e finalize a venda.',
        },
        {
          pergunta: "Como funciona o campo de busca de peças na venda?",
          resposta:
            "Ao adicionar uma peça, você pode digitar no campo de busca para filtrar por nome ou código da peça. Apenas peças ativas e com estoque disponível aparecem na lista.",
        },
        {
          pergunta: "Posso aplicar desconto em uma venda?",
          resposta:
            'Sim! Você pode aplicar um desconto percentual geral na venda (campo "Desconto %") ou descontos individuais em cada item. O sistema calcula automaticamente o valor final.',
        },
        {
          pergunta: "O que acontece com o estoque ao finalizar uma venda?",
          resposta:
            "Ao finalizar uma venda, o sistema reduz automaticamente a quantidade vendida do estoque de cada peça. Se alguma peça não tiver estoque suficiente, o sistema alertará antes de finalizar.",
        },
        {
          pergunta: "Posso cancelar uma venda?",
          resposta:
            "Sim! Vendas podem ser canceladas. Se a venda já foi finalizada (estoque já foi reduzido), o sistema devolverá automaticamente as quantidades ao estoque ao cancelar.",
        },
        {
          pergunta: "Qual a diferença entre venda pendente e concluída?",
          resposta:
            "<strong>Pendente:</strong> Venda registrada mas não finalizada, estoque não foi alterado ainda.<br><strong>Concluída:</strong> Venda finalizada, estoque reduzido e pagamento confirmado.<br><strong>Cancelada:</strong> Venda cancelada, estoque revertido se necessário.",
        },
        {
          pergunta: "Como visualizar os detalhes de uma venda?",
          resposta:
            "Na listagem de vendas, clique no ícone de olho (visualizar) ao lado da venda. Você verá todos os detalhes: cliente, itens vendidos, valores, desconto aplicado e forma de pagamento.",
        },
      ],
    },
    {
      categoria: "Trocas de Produtos",
      items: [
        {
          pergunta: "Como registrar uma troca de produto?",
          resposta:
            'Acesse "Trocas" e clique em "Nova Troca". Selecione a venda original, escolha o produto que será devolvido e o produto substituto. Informe o motivo da troca e a quantidade.',
        },
        {
          pergunta: "O que acontece com o estoque em uma troca?",
          resposta:
            "Ao aprovar uma troca, o sistema devolve a quantidade do produto trocado ao estoque e reduz a quantidade do produto substituto. É como uma devolução + uma nova venda ao mesmo tempo.",
        },
        {
          pergunta: "Preciso aprovar todas as trocas?",
          resposta:
            'Sim! Trocas ficam com status "pendente" até serem aprovadas ou rejeitadas. Isso permite que você analise cada caso antes de alterar o estoque. Apenas trocas aprovadas afetam o estoque.',
        },
        {
          pergunta: "Posso trocar por um produto de valor diferente?",
          resposta:
            "Sim! O sistema calcula automaticamente a diferença de valor. Se o produto substituto for mais caro, será gerado um valor a pagar. Se for mais barato, um valor a devolver.",
        },
        {
          pergunta: "Como rejeitar uma troca?",
          resposta:
            'Na listagem de trocas, clique em "Rejeitar" ao lado da troca pendente. Informe o motivo da rejeição. Trocas rejeitadas não afetam o estoque e ficam registradas para histórico.',
        },
      ],
    },
    {
      categoria: "Alertas e Notificações",
      items: [
        {
          pergunta: "O que são os alertas do sistema?",
          resposta:
            "O sistema gera alertas automáticos para situações importantes: estoque baixo (quando uma peça atinge o estoque mínimo) e vendas pendentes (vendas que ainda não foram finalizadas).",
        },
        {
          pergunta: "Onde visualizo os alertas?",
          resposta:
            'Os alertas aparecem no Dashboard (tela inicial) e na página "Alertas" do menu lateral. Cada alerta mostra o tipo, descrição e ações disponíveis.',
        },
        {
          pergunta: "Como resolver um alerta de estoque baixo?",
          resposta:
            'Acesse "Compras" e registre uma nova compra do fornecedor para repor o estoque. Quando o estoque for atualizado acima do mínimo, o alerta será automaticamente marcado como resolvido.',
        },
        {
          pergunta: "Como resolver um alerta de venda pendente?",
          resposta:
            'Na página de Alertas ou Vendas, localize a venda pendente e clique em "Finalizar Venda". Isso atualizará o estoque e marcará o alerta como resolvido.',
        },
        {
          pergunta: "Posso desativar alertas?",
          resposta:
            'Não é possível desativar alertas, pois eles são importantes para a gestão do negócio. No entanto, você pode marcar alertas como "resolvidos" após tomar as ações necessárias.',
        },
      ],
    },
    {
      categoria: "Dashboard e Relatórios",
      items: [
        {
          pergunta: "O que mostra o Dashboard?",
          resposta:
            "O Dashboard é a tela inicial que mostra um resumo do seu negócio: total de vendas do dia, faturamento, produtos com estoque baixo, vendas recentes e alertas ativos.",
        },
        {
          pergunta: "Que tipos de relatórios posso gerar?",
          resposta:
            "O sistema oferece relatórios de: vendas por período, produtos mais vendidos, estoque atual, histórico de preços, compras por fornecedor e análises financeiras.",
        },
        {
          pergunta: "Como filtrar relatórios por período?",
          resposta:
            "Na tela de relatórios, use os campos de data inicial e final para definir o período desejado. Você pode gerar relatórios diários, semanais, mensais ou personalizados.",
        },
        {
          pergunta: "Posso exportar relatórios?",
          resposta:
            'Sim! A maioria dos relatórios pode ser exportada em formato PDF ou Excel através do botão "Exportar" na tela de relatórios. Isso facilita o compartilhamento e arquivamento.',
        },
        {
          pergunta: "Como ver as vendas de um período específico?",
          resposta:
            'Acesse "Vendas" e use os filtros de data no topo da página. Você pode filtrar por data inicial, data final, cliente, status e forma de pagamento.',
        },
      ],
    },
    {
      categoria: "Formas de Pagamento",
      items: [
        {
          pergunta: "Quais formas de pagamento posso cadastrar?",
          resposta:
            "Você pode cadastrar qualquer forma de pagamento que sua loja aceita: Dinheiro, Cartão de Crédito, Cartão de Débito, PIX, Boleto, Transferência Bancária, etc.",
        },
        {
          pergunta: "Como cadastrar uma nova forma de pagamento?",
          resposta:
            'Acesse "Formas de Pagamento" no menu (disponível para Admin) e clique em "Nova Forma de Pagamento". Informe o nome e uma descrição opcional.',
        },
        {
          pergunta: "Posso desativar uma forma de pagamento?",
          resposta:
            "Sim! Formas de pagamento podem ser ativadas ou desativadas. Formas inativas não aparecem no formulário de vendas, mas continuam no sistema para consultas históricas.",
        },
      ],
    },
    {
      categoria: "Dicas e Boas Práticas",
      items: [
        {
          pergunta: "Como manter o estoque sempre atualizado?",
          resposta:
            "Sempre registre compras e vendas pelo sistema. Evite editar o estoque manualmente. Configure alertas de estoque mínimo para todas as peças importantes. Faça inventários periódicos para conferir.",
        },
        {
          pergunta: "Como evitar vender produtos sem estoque?",
          resposta:
            "O sistema só mostra peças com estoque disponível no formulário de vendas. Mantenha o estoque atualizado e configure estoque mínimo para receber alertas antes de acabar.",
        },
        {
          pergunta: "Qual a melhor forma de organizar as peças?",
          resposta:
            "Use categorias e marcas para organizar suas peças. Adicione imagens para facilitar a identificação. Use nomes descritivos e padronizados. Configure o estoque mínimo adequado para cada tipo de peça.",
        },
        {
          pergunta: "Como fazer backup dos dados?",
          resposta:
            "Entre em contato com o administrador do sistema ou suporte técnico para informações sobre backup. É recomendado fazer backups regulares do banco de dados.",
        },
        {
          pergunta: "O que fazer se encontrar um erro no sistema?",
          resposta:
            "Anote a mensagem de erro, a tela onde ocorreu e o que você estava fazendo. Entre em contato com o suporte técnico através do email suporte@sipc.com ou fale com o administrador do sistema.",
        },
      ],
    },
    {
      categoria: "Segurança e Privacidade",
      items: [
        {
          pergunta: "Minha senha é segura?",
          resposta:
            "Use senhas fortes com no mínimo 6 caracteres, combinando letras, números e símbolos. Nunca compartilhe sua senha com outras pessoas. Altere sua senha periodicamente.",
        },
        {
          pergunta: "Posso acessar o sistema de qualquer lugar?",
          resposta:
            "Sim, o SIPC é um sistema web que pode ser acessado de qualquer dispositivo com internet e navegador atualizado. Certifique-se de fazer logout ao usar computadores compartilhados.",
        },
        {
          pergunta: "Quem pode ver minhas informações?",
          resposta:
            "Apenas usuários autorizados com login e senha podem acessar o sistema. As permissões são controladas por tipo de usuário (Admin, Vendedor, Estoque), garantindo que cada um veja apenas o necessário.",
        },
        {
          pergunta: "O sistema registra minhas ações?",
          resposta:
            "Sim, o sistema mantém logs de ações importantes como cadastros e alterações. Isso garante rastreabilidade e segurança das operações.",
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
  console.log("✅ FAQ renderizado com sucesso")
}

function setupSearch() {
  const searchInput = document.getElementById("search-faq")
  if (!searchInput) {
    console.error("❌ Campo de busca não encontrado")
    return
  }

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

  console.log("✅ Busca configurada com sucesso")
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
