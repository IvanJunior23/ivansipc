// assets/js/enderecos.js
class EnderecoManager {
    constructor() {
        this.enderecos = [];
        this.currentEditingId = null;
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando gerenciador de endereços');
        await this.loadEnderecos();
        this.setupEventListeners();
        this.setupCEPMask();
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners');
        
        // Event listener para busca
        const searchInput = document.getElementById('searchEndereco');
        if (searchInput) {
            // Remover listeners antigos e adicionar novo
            searchInput.removeEventListener('input', this.handleSearch);
            searchInput.addEventListener('input', () => this.handleSearch());
            console.log('✅ Event listener de busca configurado');
        }

        // Event listeners para modais
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('enderecoModal')) {
                this.closeEnderecoModal();
            }
        });
    }

    setupCEPMask() {
        const cepInput = document.getElementById('enderecoCep');
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

    async fetchAddressByCEP(cep) {
        try {
            console.log('🔍 Buscando endereço por CEP:', cep);
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                document.getElementById('enderecoLogradouro').value = data.logradouro || '';
                document.getElementById('enderecoBairro').value = data.bairro || '';
                document.getElementById('enderecoCidade').value = data.localidade || '';
                document.getElementById('enderecoEstado').value = data.uf || '';
                document.getElementById('enderecoNumero').focus();
                console.log('✅ Endereço preenchido automaticamente');
            } else {
                console.log('⚠️ CEP não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao buscar CEP:', error);
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
        console.log('📡 Body da requisição:', finalOptions.body);
        
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


    async loadEnderecos() {
        try {
            this.showLoading(true);
            console.log('🔄 Carregando endereços...');
            
            const response = await this.makeAuthenticatedRequest('/api/enderecos');
            if (!response || !response.ok) {
                throw new Error('Erro ao carregar endereços');
            }

            const result = await response.json();
            if (result.success) {
                this.enderecos = result.data || [];
                console.log('✅ Endereços carregados:', this.enderecos.length);
                this.renderEnderecos(this.enderecos);
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar endereços:', error);
            this.showToast('Erro ao carregar endereços', 'error');
            this.renderEnderecos([]);
        } finally {
            this.showLoading(false);
        }
    }

    renderEnderecos(enderecos) {
        const tbody = document.getElementById('enderecosTableBody');
        if (!tbody) {
            console.error('❌ Elemento enderecosTableBody não encontrado');
            return;
        }

        if (enderecos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">Nenhum endereço encontrado</h5>
                            <p class="text-muted">Clique em "Novo Endereço" para adicionar o primeiro endereço.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = enderecos.map(endereco => {
            const statusClass = endereco.status ? '' : 'inativo';
            const statusText = endereco.status ? 'Ativo' : 'Inativo';
            const statusBadgeClass = endereco.status ? 'status-ativo' : 'status-inativo';
            
            return `
                <tr class="endereco-row ${statusClass}" data-id="${endereco.endereco_id}">
                    <td>${endereco.endereco_id}</td>
                    <td class="logradouro-cell">${this.escapeHtml(endereco.logradouro)}</td>
                    <td class="numero-cell">${this.escapeHtml(endereco.numero)}</td>
                    <td class="bairro-cell">${this.escapeHtml(endereco.bairro)}</td>
                    <td class="cidade-cell">${this.escapeHtml(endereco.cidade)}</td>
                    <td class="estado-cell">${this.escapeHtml(endereco.estado)}</td>
                    <td class="cep-cell">${this.escapeHtml(endereco.cep)}</td>
                    <td class="actions-column">
                        <div class="action-buttons">
                            <span class="status-badge ${statusBadgeClass}">
                                ${statusText}
                            </span>
                            <button class="btn-edit"
                                    onclick="enderecoManager.editEndereco(${endereco.endereco_id})"
                                    title="Editar endereço">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                            <button class="btn-toggle-status"
                                    onclick="confirmAction('${endereco.status ? 'desativar' : 'ativar'}', 'endereço', function() { enderecoManager.performToggleStatus(${endereco.endereco_id}, ${!endereco.status}); })"
                                    title="${endereco.status ? 'Desativar' : 'Ativar'} endereço">
                                <i class="fas ${endereco.status ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log('✅ Tabela renderizada com', enderecos.length, 'endereços');
    }

    async performToggleStatus(id, newStatus) {
        try {
            this.showLoading(true);
            console.log('🔄 Alterando status do endereço ID:', id, 'para:', newStatus);
            
            const response = await this.makeAuthenticatedRequest(`/api/enderecos/${id}/status`, {
                method: 'PATCH',
                body: { status: newStatus }
            });

            if (!response || !response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || `Erro ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Status alterado com sucesso:', result);
            
            const statusText = newStatus ? 'ativado' : 'inativado';
            this.showToast(`Endereço ${statusText} com sucesso!`, 'success');
            
            setTimeout(async () => {
                await this.loadEnderecos();
            }, 500);
            
        } catch (error) {
            console.error('❌ Erro ao alterar status:', error);
            this.showToast(error.message || 'Erro ao alterar status do endereço', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showAddEnderecoModal() {
        console.log('📝 Abrindo modal para novo endereço');
        this.currentEditingId = null;
        document.getElementById('enderecoModalTitle').textContent = 'Novo Endereço';
        document.getElementById('enderecoForm').reset();
        document.getElementById('enderecoId').value = '';
        document.getElementById('enderecoModal').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('enderecoCep').focus();
        }, 100);
    }

    async editEndereco(id) {
        console.log('📝 Editando endereço ID:', id);
        const endereco = this.enderecos.find(e => e.endereco_id === id);
        if (!endereco) {
            this.showToast('Endereço não encontrado', 'error');
            return;
        }

        this.currentEditingId = id;
        document.getElementById('enderecoModalTitle').textContent = 'Editar Endereço';
        document.getElementById('enderecoId').value = id;
        document.getElementById('enderecoCep').value = endereco.cep || '';
        document.getElementById('enderecoLogradouro').value = endereco.logradouro || '';
        document.getElementById('enderecoNumero').value = endereco.numero || '';
        document.getElementById('enderecoComplemento').value = endereco.complemento || '';
        document.getElementById('enderecoBairro').value = endereco.bairro || '';
        document.getElementById('enderecoCidade').value = endereco.cidade || '';
        document.getElementById('enderecoEstado').value = endereco.estado || '';
        document.getElementById('enderecoModal').style.display = 'block';
    }

    closeEnderecoModal() {
        console.log('📝 Fechando modal de endereço');
        document.getElementById('enderecoModal').style.display = 'none';
        document.getElementById('enderecoForm').reset();
        this.currentEditingId = null;
    }

  async handleFormSubmit(event) {
    console.log('📝 handleFormSubmit chamada');
    event.preventDefault();
    
    console.log('📝 Coletando dados do formulário...');
    const formData = new FormData(event.target);
    
    // Log dos dados coletados
    for (let [key, value] of formData.entries()) {
        console.log(`📝 Campo ${key}:`, value);
    }
    
    // CORREÇÃO: Tratar valores vazios como null para campos opcionais
    // CORREÇÃO: Adicionar user_id e garantir que todos os campos sejam definidos
const enderecoData = {
    cep: (formData.get('cep') || '').replace(/\D/g, ''),
    logradouro: formData.get('logradouro') || '',
    numero: formData.get('numero') || '',
    complemento: formData.get('complemento')?.trim() || null,
    bairro: formData.get('bairro') || '',
    cidade: formData.get('cidade') || '',
    estado: (formData.get('estado') || '').toUpperCase(),
    status: 1 // Adicionar status ativo por padrão
};

    
    console.log('📝 Dados processados:', enderecoData);

    // Validações
    if (!enderecoData.cep || enderecoData.cep.length !== 8) {
        this.showToast('CEP deve ter 8 dígitos', 'error');
        return false;
    }

    if (!enderecoData.logradouro.trim()) {
        this.showToast('Logradouro é obrigatório', 'error');
        return false;
    }

    if (!enderecoData.numero.trim()) {
        this.showToast('Número é obrigatório', 'error');
        return false;
    }

    if (!enderecoData.bairro.trim()) {
        this.showToast('Bairro é obrigatório', 'error');
        return false;
    }

    if (!enderecoData.cidade.trim()) {
        this.showToast('Cidade é obrigatória', 'error');
        return false;
    }

    if (!enderecoData.estado || enderecoData.estado.length !== 2) {
        this.showToast('Estado deve ter 2 caracteres', 'error');
        return false;
    }

    console.log('🔍 DIAGNÓSTICO DETALHADO:');
Object.keys(enderecoData).forEach(key => {
    const value = enderecoData[key];
    console.log(`  ${key}:`, value, `(tipo: ${typeof value})`);
    if (value === undefined) {
        console.error(`❌ CAMPO ${key} É UNDEFINED!`);
    }
});


    try {
        this.showLoading(true);
        const isEdit = this.currentEditingId !== null;
        const url = isEdit ? `/api/enderecos/${this.currentEditingId}` : '/api/enderecos';
        const method = isEdit ? 'PUT' : 'POST';

        console.log(`🔄 ${isEdit ? 'Atualizando' : 'Criando'} endereço:`, enderecoData);

        const response = await this.makeAuthenticatedRequest(url, {
            method: method,
            body: enderecoData
        });

        if (!response || !response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('❌ Resposta da API:', errorData);
            throw new Error(errorData.error || 'Erro ao salvar endereço');
        }

        const result = await response.json();
        console.log('✅ Endereço salvo com sucesso:', result);

        this.showToast(result.message || `Endereço ${isEdit ? 'atualizado' : 'criado'} com sucesso!`, 'success');
        this.closeEnderecoModal();

        setTimeout(async () => {
            await this.loadEnderecos();
        }, 500);

    } catch (error) {
        console.error('❌ Erro ao salvar endereço:', error);
        this.showToast(error.message || 'Erro ao salvar endereço', 'error');
    } finally {
        this.showLoading(false);
    }
    
    return false;
}




    handleSearch() {
        const searchTerm = document.getElementById('searchEndereco').value.toLowerCase().trim();
        console.log('🔍 Buscando por:', searchTerm);
        
        if (!searchTerm) {
            console.log('🔍 Busca vazia, mostrando todos os endereços');
            this.renderEnderecos(this.enderecos);
            return;
        }

        const filtered = this.enderecos.filter(endereco => {
            const matches = 
                endereco.logradouro.toLowerCase().includes(searchTerm) ||
                endereco.numero.toLowerCase().includes(searchTerm) ||
                endereco.bairro.toLowerCase().includes(searchTerm) ||
                endereco.cidade.toLowerCase().includes(searchTerm) ||
                endereco.estado.toLowerCase().includes(searchTerm) ||
                endereco.cep.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''));
            
            if (matches) {
                console.log('🎯 Match encontrado:', endereco.logradouro);
            }
            return matches;
        });

        console.log(`🔍 Busca por "${searchTerm}" encontrou ${filtered.length} endereços`);
        this.renderEnderecos(filtered);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    showLoading(show) {
        console.log(show ? '⏳ Carregando...' : '✅ Carregamento concluído');
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
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Funções globais para compatibilidade com HTML
let enderecoManager;

function showAddEnderecoModal() {
    console.log('🌐 showAddEnderecoModal chamada');
    enderecoManager.showAddEnderecoModal();
}

function closeEnderecoModal() {
    console.log('🌐 closeEnderecoModal chamada');
    enderecoManager.closeEnderecoModal();
}

function saveEnderecoForm(event) {
    console.log('🌐 saveEnderecoForm chamada - prevenindo submit padrão');
    event.preventDefault();
    return enderecoManager.handleFormSubmit(event);
}

function searchEnderecos() {
    console.log('🌐 searchEnderecos chamada (DEPRECIADA)');
    enderecoManager.handleSearch();
}

function confirmAction(action, item, callback) {
    const message = `Tem certeza que deseja ${action} este ${item}?`;
    if (confirm(message)) {
        callback();
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando EnderecoManager');
    enderecoManager = new EnderecoManager();
});
