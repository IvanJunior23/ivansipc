// assets/js/pessoas.js
class PessoaManager {
    constructor() {
        this.pessoas = [];
        this.currentEditingId = null;
        this.isSubmitting = false;
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando gerenciador de pessoas');
        await this.loadPessoas();
        this.setupEventListeners();
        this.setupCEPMask();
        this.setupPhoneMask();
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners');
        
        // Event listener para busca
        const searchInput = document.getElementById('searchPessoa');
        if (searchInput) {
            searchInput.removeEventListener('input', this.handleSearch);
            searchInput.addEventListener('input', () => this.handleSearch());
            console.log('✅ Event listener de busca configurado');
        }

        // Event listeners para modais
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('pessoaModal')) {
                this.closePessoaModal();
            }
        });

        // Event listener para ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePessoaModal();
            }
        });
    }

    setupCEPMask() {
        const cepInput = document.getElementById('pessoaCep');
        if (cepInput) {
            cepInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 6) {
                    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                }
                e.target.value = value;
                if (value.replace(/\D/g, '').length === 8) {
                    this.fetchAddressByCEP(value.replace(/\D/g, ''));
                }
            });
        }
    }

    setupPhoneMask() {
        const telefoneInput = document.getElementById('pessoaTelefone');
        const celularInput = document.getElementById('pessoaCelular');
        
        [telefoneInput, celularInput].forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                        // Telefone fixo: (11) 1234-5678
                        value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
                    } else {
                        // Celular: (11) 91234-5678
                        value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
                    }
                    e.target.value = value;
                });
            }
        });
    }

    async fetchAddressByCEP(cep) {
        try {
            console.log('🔍 Buscando endereço por CEP:', cep);
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                document.getElementById('pessoaLogradouro').value = data.logradouro || '';
                document.getElementById('pessoaBairro').value = data.bairro || '';
                document.getElementById('pessoaCidade').value = data.localidade || '';
                document.getElementById('pessoaEstado').value = data.uf || '';
                document.getElementById('pessoaNumero').focus();
                console.log('✅ Endereço preenchido automaticamente');
            } else {
                console.log('⚠️ CEP não encontrado');
                this.showToast('CEP não encontrado', 'warning');
            }
        } catch (error) {
            console.error('❌ Erro ao buscar CEP:', error);
            this.showToast('Erro ao buscar CEP', 'error');
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ Token não encontrado');
            window.location.href = 'login.html';
            return null;
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const finalOptions = { ...defaultOptions, ...options };
        if (options.body && typeof options.body === 'object') {
            finalOptions.body = JSON.stringify(options.body);
        }

        try {
            console.log('📡 Fazendo requisição:', url, finalOptions.method || 'GET');
            const response = await fetch(`http://localhost:3000${url}`, finalOptions);
            console.log('📡 Status da resposta:', response.status);

            if (response.status === 401) {
                console.error('❌ Token expirado, redirecionando para login');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return null;
            }

            return response;
        } catch (error) {
            console.error('❌ Erro na requisição:', error);
            this.showToast('Erro de conexão com o servidor', 'error');
            return null;
        }
    }

    async loadPessoas() {
        try {
            this.showLoading(true);
            console.log('🔄 Carregando pessoas...');
            
            const response = await this.makeAuthenticatedRequest('/api/pessoas');
            if (!response || !response.ok) {
                throw new Error('Erro ao carregar pessoas');
            }

            const result = await response.json();
            if (result.success) {
                this.pessoas = result.data || [];
                console.log('✅ Pessoas carregadas:', this.pessoas.length);
                this.renderPessoas(this.pessoas);
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar pessoas:', error);
            this.showToast('Erro ao carregar pessoas', 'error');
            this.renderPessoas([]);
        } finally {
            this.showLoading(false);
        }
    }

    renderPessoas(pessoas) {
        const tbody = document.getElementById('pessoasTableBody');
        if (!tbody) {
            console.error('❌ Elemento pessoasTableBody não encontrado');
            return;
        }

        if (pessoas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-users fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Nenhuma pessoa encontrada</h5>
                            <p class="text-muted">Clique em "Nova Pessoa" para adicionar a primeira pessoa.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pessoas.map(pessoa => {
            const statusClass = pessoa.status ? '' : 'inativo';
            const statusText = pessoa.status ? 'Ativo' : 'Inativo';
            const statusBadgeClass = pessoa.status ? 'status-ativo' : 'status-inativo';
            const createdDate = this.formatDate(pessoa.created_at);
            
            // Construir endereço resumido
            const enderecoResumo = pessoa.endereco ? 
                `${pessoa.endereco.logradouro}, ${pessoa.endereco.numero} - ${pessoa.endereco.bairro}` : 
                'Sem endereço';
            
            // Construir contato resumido
            const contatoResumo = pessoa.contato ? 
                (pessoa.contato.celular || pessoa.contato.telefone || pessoa.contato.email || 'Sem contato') : 
                'Sem contato';

            return `
                <tr class="pessoa-row ${statusClass}" data-id="${pessoa.pessoa_id}">
                    <td>${pessoa.pessoa_id}</td>
                    <td class="nome-cell">${this.escapeHtml(pessoa.nome)}</td>
                    <td class="endereco-cell" title="${this.escapeHtml(enderecoResumo)}">${this.truncateText(enderecoResumo, 30)}</td>
                    <td class="contato-cell" title="${this.escapeHtml(contatoResumo)}">${this.truncateText(contatoResumo, 25)}</td>
                    <td class="data-cell">${createdDate}</td>
                    <td class="actions-column">
                        <div class="action-buttons">
                            <span class="status-badge ${statusBadgeClass}">
                                ${statusText}
                            </span>
                            <button class="btn-edit"
                                    onclick="pessoaManager.editPessoa(${pessoa.pessoa_id})"
                                    title="Editar pessoa">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn-toggle-status"
                                    onclick="confirmAction('${pessoa.status ? 'desativar' : 'ativar'}', 'pessoa', function() { pessoaManager.performToggleStatus(${pessoa.pessoa_id}, ${!pessoa.status}); })"
                                    title="${pessoa.status ? 'Desativar' : 'Ativar'} pessoa">
                                <i class="fas ${pessoa.status ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log('✅ Tabela renderizada com', pessoas.length, 'pessoas');
    }

    async performToggleStatus(id, newStatus) {
        try {
            this.showLoading(true);
            console.log('🔄 Alterando status da pessoa ID:', id, 'para:', newStatus);
            
            const response = await this.makeAuthenticatedRequest(`/api/pessoas/${id}/status`, {
                method: 'PATCH',
                body: { status: newStatus }
            });

            if (!response || !response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || `Erro ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Status alterado com sucesso:', result);
            
            const statusText = newStatus ? 'ativada' : 'inativada';
            this.showToast(`Pessoa ${statusText} com sucesso!`, 'success');
            
            setTimeout(async () => {
                await this.loadPessoas();
            }, 500);
        } catch (error) {
            console.error('❌ Erro ao alterar status:', error);
            this.showToast(error.message || 'Erro ao alterar status da pessoa', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showAddPessoaModal() {
        console.log('📝 Abrindo modal para nova pessoa');
        this.currentEditingId = null;
        document.getElementById('pessoaModalTitle').textContent = 'Nova Pessoa';
        document.getElementById('pessoaForm').reset();
        document.getElementById('pessoaId').value = '';
        document.getElementById('pessoaModal').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('pessoaNome').focus();
        }, 100);
    }

    async editPessoa(id) {
        console.log('📝 Editando pessoa ID:', id);
        
        try {
            // Buscar dados completos da pessoa
            const response = await this.makeAuthenticatedRequest(`/api/pessoas/${id}`);
            if (!response || !response.ok) {
                throw new Error('Erro ao carregar dados da pessoa');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Pessoa não encontrada');
            }

            const pessoa = result.data;
            this.currentEditingId = id;
            
            document.getElementById('pessoaModalTitle').textContent = 'Editar Pessoa';
            
            // Preencher dados da pessoa
            document.getElementById('pessoaId').value = id;
            document.getElementById('pessoaNome').value = pessoa.nome || '';
            
            // Preencher dados do endereço
            if (pessoa.endereco) {
                document.getElementById('pessoaCep').value = pessoa.endereco.cep || '';
                document.getElementById('pessoaLogradouro').value = pessoa.endereco.logradouro || '';
                document.getElementById('pessoaNumero').value = pessoa.endereco.numero || '';
                document.getElementById('pessoaComplemento').value = pessoa.endereco.complemento || '';
                document.getElementById('pessoaBairro').value = pessoa.endereco.bairro || '';
                document.getElementById('pessoaCidade').value = pessoa.endereco.cidade || '';
                document.getElementById('pessoaEstado').value = pessoa.endereco.estado || '';
            }
            
            // Preencher dados do contato
            if (pessoa.contato) {
                document.getElementById('pessoaEmail').value = pessoa.contato.email || '';
                document.getElementById('pessoaTelefone').value = pessoa.contato.telefone || '';
                document.getElementById('pessoaCelular').value = pessoa.contato.celular || '';
            }
            
            document.getElementById('pessoaModal').style.display = 'block';
            
        } catch (error) {
            console.error('❌ Erro ao carregar pessoa:', error);
            this.showToast(error.message || 'Erro ao carregar dados da pessoa', 'error');
        }
    }

    closePessoaModal() {
        console.log('📝 Fechando modal de pessoa');
        document.getElementById('pessoaModal').style.display = 'none';
        document.getElementById('pessoaForm').reset();
        this.currentEditingId = null;
        this.isSubmitting = false;
    }

    async handleFormSubmit(event) {
        console.log('📝 handleFormSubmit chamada');
        event.preventDefault();
        
        if (this.isSubmitting) {
            console.log('⏳ Submissão já em andamento, ignorando...');
            return false;
        }

        this.isSubmitting = true;
        
        try {
            console.log('📝 Coletando dados do formulário...');
            const formData = new FormData(event.target);
            
            // Dados da pessoa
            const pessoaData = {
                nome: (formData.get('nome') || '').trim()
            };

            // Dados do endereço
            const enderecoData = {
                cep: (formData.get('cep') || '').replace(/\D/g, ''),
                logradouro: (formData.get('logradouro') || '').trim(),
                numero: (formData.get('numero') || '').trim(),
                complemento: (formData.get('complemento') || '').trim() || null,
                bairro: (formData.get('bairro') || '').trim(),
                cidade: (formData.get('cidade') || '').trim(),
                estado: ((formData.get('estado') || '').trim()).toUpperCase()
            };

            // Dados do contato
            const contatoData = {
                email: (formData.get('email') || '').trim() || null,
                telefone: (formData.get('telefone') || '').replace(/\D/g, '') || null,
                celular: (formData.get('celular') || '').replace(/\D/g, '') || null
            };

            console.log('📝 Dados coletados:', { pessoaData, enderecoData, contatoData });

            // Validações
            if (!pessoaData.nome) {
                this.showToast('Nome é obrigatório', 'error');
                return false;
            }

            // Validar endereço (pelo menos CEP e logradouro)
            if (enderecoData.cep && enderecoData.cep.length !== 8) {
                this.showToast('CEP deve ter 8 dígitos', 'error');
                return false;
            }

            // Validar email se fornecido
            if (contatoData.email && !this.isValidEmail(contatoData.email)) {
                this.showToast('Email inválido', 'error');
                return false;
            }

            // Preparar dados para envio
            const requestData = {
                pessoa: pessoaData,
                endereco: enderecoData,
                contato: contatoData
            };

            await this.savePessoa(requestData);
            return true;
            
        } catch (error) {
            console.error('❌ Erro no formulário:', error);
            this.showToast(error.message || 'Erro ao salvar pessoa', 'error');
            return false;
        } finally {
            this.isSubmitting = false;
        }
    }

    async savePessoa(data) {
        try {
            this.showLoading(true);
            const isEdit = this.currentEditingId !== null;
            const url = isEdit ? `/api/pessoas/${this.currentEditingId}` : '/api/pessoas';
            const method = isEdit ? 'PUT' : 'POST';

            console.log(`🔄 ${isEdit ? 'Atualizando' : 'Criando'} pessoa:`, data);

            const response = await this.makeAuthenticatedRequest(url, {
                method: method,
                body: data
            });

            if (!response || !response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                console.error('❌ Resposta da API:', errorData);
                throw new Error(errorData.error || 'Erro ao salvar pessoa');
            }

            const result = await response.json();
            console.log('✅ Pessoa salva com sucesso:', result);

            this.showToast(
                result.message || `Pessoa ${isEdit ? 'atualizada' : 'criada'} com sucesso!`, 
                'success'
            );

            this.closePessoaModal();
            
            setTimeout(async () => {
                await this.loadPessoas();
            }, 500);

        } catch (error) {
            console.error('❌ Erro ao salvar pessoa:', error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchPessoa').value.toLowerCase().trim();
        console.log('🔍 Buscando por:', searchTerm);

        if (!searchTerm) {
            console.log('🔍 Busca vazia, mostrando todas as pessoas');
            this.renderPessoas(this.pessoas);
            return;
        }

        const filtered = this.pessoas.filter(pessoa => {
            const nomeMatch = pessoa.nome.toLowerCase().includes(searchTerm);
            
            const enderecoMatch = pessoa.endereco && (
                pessoa.endereco.logradouro.toLowerCase().includes(searchTerm) ||
                pessoa.endereco.bairro.toLowerCase().includes(searchTerm) ||
                pessoa.endereco.cidade.toLowerCase().includes(searchTerm) ||
                pessoa.endereco.cep.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
            );
            
            const contatoMatch = pessoa.contato && (
                (pessoa.contato.email && pessoa.contato.email.toLowerCase().includes(searchTerm)) ||
                (pessoa.contato.telefone && pessoa.contato.telefone.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))) ||
                (pessoa.contato.celular && pessoa.contato.celular.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')))
            );

            return nomeMatch || enderecoMatch || contatoMatch;
        });

        console.log(`🔍 Busca por "${searchTerm}" encontrou ${filtered.length} pessoas`);
        this.renderPessoas(filtered);
    }

    // Utility methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return '-';
        }
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    showLoading(show) {
        console.log(show ? '⏳ Carregando...' : '✅ Carregamento concluído');
        
        // Adicionar indicador visual de loading se necessário
        const loadingElement = document.getElementById('loadingIndicator');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showToast(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: ${type === 'warning' ? '#000' : '#fff'};
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Funções globais para compatibilidade com HTML
let pessoaManager;

function showAddPessoaModal() {
    console.log('🌐 showAddPessoaModal chamada');
    pessoaManager.showAddPessoaModal();
}

function closePessoaModal() {
    console.log('🌐 closePessoaModal chamada');
    pessoaManager.closePessoaModal();
}

function savePessoaForm(event) {
    console.log('🌐 savePessoaForm chamada - prevenindo submit padrão');
    event.preventDefault();
    return pessoaManager.handleFormSubmit(event);
}

function confirmAction(action, item, callback) {
    const message = `Tem certeza que deseja ${action} esta ${item}?`;
    if (confirm(message)) {
        callback();
    }
}

// Adicionar estilos para animações
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .pessoa-row.inativo {
        opacity: 0.6;
        background-color: #f8f9fa;
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-ativo {
        background-color: #d4edda;
        color: #155724;
    }
    
    .status-inativo {
        background-color: #f8d7da;
        color: #721c24;
    }
    
    .action-buttons {
        display: flex;
        gap: 5px;
        align-items: center;
    }
    
    .btn-edit, .btn-toggle-status {
        padding: 5px 8px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .btn-edit {
        background-color: #007bff;
        color: white;
    }
    
    .btn-toggle-status {
        background-color: #6c757d;
        color: white;
    }
    
    .btn-edit:hover {
        background-color: #0056b3;
    }
    
    .btn-toggle-status:hover {
        background-color: #545b62;
    }
`;
document.head.appendChild(styles);

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando PessoaManager');
    pessoaManager = new PessoaManager();
});
