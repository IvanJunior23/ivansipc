document.addEventListener('DOMContentLoaded', () => {
    let isLoading = false;

    // Função para carregar dados do dashboard
    async function carregarDashboard() {
        if (isLoading) return;
        isLoading = true;

        try {
            await Promise.all([
                carregarEstatisticas(),
                carregarAtividadesRecentes(),
                carregarEstoqueBaixo(),
                carregarVendasRecentes()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            isLoading = false;
        }
    }

    // Carregar estatísticas gerais
    async function carregarEstatisticas() {
        try {
            // Simulação de dados - substitua pelas chamadas reais da API
            document.getElementById('total-usuarios').textContent = '12';
            document.getElementById('total-produtos').textContent = '248';
            document.getElementById('total-vendas').textContent = '15';
            document.getElementById('faturamento-hoje').textContent = 'R$ 3.450,00';
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // Carregar atividades recentes
    async function carregarAtividadesRecentes() {
        const container = document.getElementById('atividades-recentes');
        
        try {
            // Simulação de dados - substitua pela chamada real da API
            const atividades = [
                {
                    tipo: 'venda',
                    titulo: 'Nova venda realizada',
                    descricao: 'Venda #001234 - R$ 150,00',
                    tempo: '5 min atrás'
                },
                {
                    tipo: 'produto',
                    titulo: 'Produto cadastrado',
                    descricao: 'Smartphone XYZ adicionado',
                    tempo: '1 hora atrás'
                },
                {
                    tipo: 'usuario',
                    titulo: 'Novo usuário',
                    descricao: 'João Silva foi cadastrado',
                    tempo: '2 horas atrás'
                }
            ];

            container.innerHTML = atividades.map(atividade => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${getActivityIcon(atividade.tipo)}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${atividade.titulo}</h4>
                        <p>${atividade.descricao} • ${atividade.tempo}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            container.innerHTML = '<p class="text-center">Erro ao carregar atividades</p>';
        }
    }

    // Carregar produtos com estoque baixo
    async function carregarEstoqueBaixo() {
        const container = document.getElementById('estoque-baixo');
        
        try {
            // Simulação de dados - substitua pela chamada real da API
            const produtos = [
                { nome: 'Smartphone ABC', categoria: 'Eletrônicos', quantidade: 3 },
                { nome: 'Notebook XYZ', categoria: 'Informática', quantidade: 1 },
                { nome: 'Mouse Gamer', categoria: 'Acessórios', quantidade: 5 }
            ];

            if (produtos.length === 0) {
                container.innerHTML = '<p class="text-center">Nenhum produto com estoque baixo</p>';
                return;
            }

            container.innerHTML = produtos.map(produto => `
                <div class="estoque-item">
                    <div class="estoque-info">
                        <h4>${produto.nome}</h4>
                        <p>${produto.categoria}</p>
                    </div>
                    <div class="estoque-quantidade">${produto.quantidade}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Erro ao carregar estoque baixo:', error);
            container.innerHTML = '<p class="text-center">Erro ao carregar dados</p>';
        }
    }

    // Carregar vendas recentes
    async function carregarVendasRecentes() {
        const container = document.getElementById('vendas-recentes');
        
        try {
            // Simulação de dados - substitua pela chamada real da API
            const vendas = [
                { id: '001234', cliente: 'João Silva', valor: 150.00, status: 'concluida', data: '2025-01-15 14:30' },
                { id: '001233', cliente: 'Maria Santos', valor: 89.90, status: 'pendente', data: '2025-01-15 13:15' },
                { id: '001232', cliente: 'Pedro Costa', valor: 250.00, status: 'concluida', data: '2025-01-15 11:45' }
            ];

            if (vendas.length === 0) {
                container.innerHTML = '<p class="text-center">Nenhuma venda encontrada</p>';
                return;
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
                        ${vendas.map(venda => `
                            <tr>
                                <td>#${venda.id}</td>
                                <td>${venda.cliente}</td>
                                <td>R$ ${venda.valor.toFixed(2).replace('.', ',')}</td>
                                <td><span class="status-badge ${venda.status}">${venda.status}</span></td>
                                <td>${formatarData(venda.data)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Erro ao carregar vendas recentes:', error);
            container.innerHTML = '<p class="text-center">Erro ao carregar vendas</p>';
        }
    }

    // Funções auxiliares
    function getActivityIcon(tipo) {
        switch (tipo) {
            case 'venda': return 'shopping-cart';
            case 'produto': return 'box';
            case 'usuario': return 'user';
            default: return 'bell';
        }
    }

    function formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    // Inicialização
    function init() {
        try {
            carregarDashboard();
        } catch (error) {
            console.error('Erro na inicialização do dashboard:', error);
        }
    }

    // Aguardar auth estar disponível
    if (typeof auth !== 'undefined' && auth.user) {
        init();
    } else {
        setTimeout(init, 500);
    }

    // Recarregar dados a cada 5 minutos
    setInterval(carregarDashboard, 5 * 60 * 1000);
});
