// public/assets/js/contatos.js
class ContatoManager {
    constructor() {
        this.contatos = [];
        this.editingId = null;
        this.confirmCallback = null;
        this.isSubmitting = false; // Flag para prevenir duplicação
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContatos();
    }

    setupEventListeners() {
        // Modal events
        window.showAddContatoModal = () => this.showAddContatoModal();
        window.closeContatoModal = () => this.closeContatoModal();
        window.saveContatoForm = (e) => this.handleSubmit(e);
        window.searchContatos = () => this.handleSearch();
        window.closeConfirmModal = () => this.closeConfirmModal();
        window.confirmAction = () => this.confirmAction();
        
        // Form submission
        const form = document.getElementById('contatoForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(e);
            });
        }

        // Search input
        const searchInput = document.getElementById('searchContato');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        // Phone formatting
        const phoneInput = document.getElementById('contatoTelefone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => this.formatPhoneInput(e));
        }
    }

    // Fazer requisições autenticadas
    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('authToken') || 
                      sessionStorage.getItem('authToken') ||
                      localStorage.getItem('token') || 
                      sessionStorage.getItem('token');

        if (!token) {
            this.showToast('Sessão expirada. Faça login novamente.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return null;
        }

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                this.showToast('Sessão expirada. Faça login novamente.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return null;
            }

            return response;
        } catch (error) {
            console.error('Erro na requisição autenticada:', error);
            throw error;
        }
    }

    async loadContatos() {
        try {
            this.showLoading(true);
            
            const response = await this.makeAuthenticatedRequest('/api/contatos');
            if (!response) return;

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            this.contatos = data.data || [];
            this.renderContatos();
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
            this.showToast('Erro ao carregar contatos', 'error');
            this.showEmptyState();
        } finally {
            this.showLoading(false);
        }
    }

    showAddContatoModal() {
        this.resetForm();
        document.getElementById('contatoModalTitle').textContent = 'Novo Contato';
        document.getElementById('contatoModal').style.display = 'block';
    }

    closeContatoModal() {
        document.getElementById('contatoModal').style.display = 'none';
        this.resetForm();
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Prevenir submissões duplicadas - MAIS RIGOROSO
        if (this.isSubmitting) {
            console.log('Submissão já em andamento, ignorando...');
            return;
        }

        this.isSubmitting = true;
        
        const submitBtn = document.querySelector('#contatoForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }
        
        try {
            const formData = new FormData(e.target);
            const contatoData = {
                nome_completo: formData.get('nome_completo').trim(),
                telefone: this.cleanPhone(formData.get('telefone').trim()),
                email: formData.get('email').trim() || null
            };

            if (!this.validateForm(contatoData)) {
                return;
            }

            const url = this.editingId ? `/api/contatos/${this.editingId}` : '/api/contatos';
            const method = this.editingId ? 'PUT' : 'POST';
            
            console.log('Enviando requisição:', { url, method, data: contatoData });
            
            const response = await this.makeAuthenticatedRequest(url, {
                method: method,
                body: JSON.stringify(contatoData)
            });

            if (!response) return;

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar contato');
            }

            const result = await response.json();
            console.log('Resposta do servidor:', result);

            this.showToast(
                this.editingId ? 'Contato atualizado com sucesso!' : 'Contato criado com sucesso!',
                'success'
            );
            
            this.closeContatoModal();
            
            // Aguardar um pouco antes de recarregar para evitar conflitos
            setTimeout(async () => {
                await this.loadContatos();
            }, 500);
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showToast(error.message, 'error');
        } finally {
            // SEMPRE resetar a flag e o botão
            this.isSubmitting = false;
            this.resetSubmitButton(submitBtn);
        }
    }

    resetSubmitButton(btn) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Salvar';
        }
    }

    validateForm(data) {
        if (!data.nome_completo || data.nome_completo.length < 2) {
            this.showToast('Nome deve ter pelo menos 2 caracteres', 'error');
            return false;
        }

        if (!data.telefone || data.telefone.length < 10) {
            this.showToast('Telefone deve ter pelo menos 10 dígitos', 'error');
            return false;
        }

        if (data.email && !this.isValidEmail(data.email)) {
            this.showToast('Email inválido', 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    renderContatos() {
    const tbody = document.getElementById('contatosTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('contatosTable');
    
    if (!tbody) return;
    
    if (this.contatos.length === 0) {
        this.showEmptyState();
        return;
    }
    
    // Esconder empty state e mostrar tabela
    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = 'table';
    
    tbody.innerHTML = this.contatos.map(contato => {
        const isActive = contato.ativo === 1 || contato.ativo === true || contato.ativo === '1';
        
        return `
            <tr class="contact-row ${isActive ? '' : 'inativo'}">
                <td>${contato.contato_id}</td>
                <td>${this.escapeHtml(contato.nome_completo)}</td>
                <td>
                    <a href="tel:${contato.telefone}" class="text-decoration-none">
                        ${this.formatPhone(contato.telefone)}
                    </a>
                </td>
                <td>
                    ${contato.email ?
                        `<a href="mailto:${contato.email}" class="text-decoration-none">
                            ${this.escapeHtml(contato.email)}
                        </a>` :
                        '<span style="color: #666;">-</span>'
                    }
                </td>
                <td class="actions-column">
                    <div class="action-buttons">
                        <span class="status-badge ${isActive ? 'status-ativo' : 'status-inativo'}">
                            ${isActive ? 'ATIVO' : 'INATIVO'}
                        </span>
                        <button class="btn-edit" 
                                onclick="contatoManager.editContato(${contato.contato_id})" 
                                title="Editar contato">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn-toggle-status" 
                                onclick="contatoManager.toggleStatusContato(${contato.contato_id}, ${isActive})" 
                                title="${isActive ? 'Inativar' : 'Ativar'} contato">
                            <i class="fas ${isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}


               

    showEmptyState() {
        const tbody = document.getElementById('contatosTableBody');
        const emptyState = document.getElementById('emptyState');
        const table = document.getElementById('contatosTable');
        
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (table) table.style.display = 'none';
    }

    editContato(id) {
        const contato = this.contatos.find(c => c.contato_id === id);
        if (!contato) return;

        this.editingId = id;
        
        document.getElementById('contatoId').value = id;
        document.getElementById('contatoNome').value = contato.nome_completo;
        document.getElementById('contatoTelefone').value = this.formatPhone(contato.telefone);
        document.getElementById('contatoEmail').value = contato.email || '';
        
        document.getElementById('contatoModalTitle').textContent = 'Editar Contato';
        document.getElementById('contatoModal').style.display = 'block';
    }

    toggleStatusContato(id, currentStatus) {
    const contato = this.contatos.find(c => c.contato_id === id);
    if (!contato) return;
    
    const action = currentStatus ? 'inativar' : 'ativar';
    
    this.showConfirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Contato`,
        `Tem certeza que deseja ${action} o contato "<strong>${contato.nome_completo}</strong>"?`,
        () => this.performToggleStatus(id, !currentStatus)
    );
}


    // Em contatos.js, substitua o método performToggleStatus:

async performToggleStatus(id, newStatus) {
    try {
        this.showLoading(true);
        
        console.log('🔄 Alterando status do contato ID:', id, 'para:', newStatus);
        
        // USAR a nova rota específica para status com PATCH
        const response = await this.makeAuthenticatedRequest(`/api/contatos/${id}/status`, {
            method: 'PATCH',  // Mudança aqui: PATCH em vez de PUT
            body: JSON.stringify({ ativo: newStatus })
        });

        if (!response) {
            console.error('❌ Resposta vazia do servidor');
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('❌ Erro da API:', errorData);
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Status alterado com sucesso:', result);

        const statusText = newStatus ? 'ativado' : 'inativado';
        this.showToast(`Contato ${statusText} com sucesso!`, 'success');
        
        // Recarregar a lista após um delay
        setTimeout(async () => {
            await this.loadContatos();
        }, 500);
        
    } catch (error) {
        console.error('❌ Erro ao alterar status:', error);
        this.showToast(error.message || 'Erro ao alterar status do contato', 'error');
    } finally {
        this.showLoading(false);
    }
}


    handleSearch() {
        const searchTerm = document.getElementById('searchContato').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderContatos();
            return;
        }

        const filteredContatos = this.contatos.filter(contato =>
            contato.nome_completo.toLowerCase().includes(searchTerm) ||
            contato.telefone.includes(searchTerm) ||
            (contato.email && contato.email.toLowerCase().includes(searchTerm))
        );

        const originalContatos = this.contatos;
        this.contatos = filteredContatos;
        this.renderContatos();
        this.contatos = originalContatos;
    }

    resetForm() {
        this.editingId = null;
        this.isSubmitting = false; // Reset da flag também
        const form = document.getElementById('contatoForm');
        if (form) form.reset();
        document.getElementById('contatoId').value = '';
        
        // Resetar botão de submit
        const submitBtn = document.querySelector('#contatoForm button[type="submit"]');
        this.resetSubmitButton(submitBtn);
    }

    // Utility Functions
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
        }
        return phone;
    }

    cleanPhone(phone) {
        return phone.replace(/\D/g, '');
    }

    formatPhoneInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 11) {
            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d{0,2})/, '($1');
            }
        }
        
        e.target.value = value;
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loadingContatos');
        const tableContainer = document.querySelector('.table-responsive');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        if (tableContainer) {
            tableContainer.style.display = show ? 'none' : 'block';
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        const toastId = 'toast-' + Date.now();
        
        const bgColor = type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db';
        const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle';
        
        const toastHtml = `
            <div id="${toastId}" class="custom-toast" style="
                background: ${bgColor}; 
                color: white; 
                padding: 12px 20px; 
                margin-bottom: 10px; 
                border-radius: 5px; 
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                animation: slideIn 0.3s ease-out;
            ">
                <i class="fas fa-${icon}" style="margin-right: 8px;"></i>
                ${message}
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(container);
        return container;
    }

    showConfirm(title, message, callback) {
        this.confirmCallback = callback;
        
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalMessage').innerHTML = message;
        document.getElementById('confirmModal').style.display = 'block';
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.confirmCallback = null;
    }

    confirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
            this.confirmCallback = null;
        }
        this.closeConfirmModal();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.contatoManager = new ContatoManager();
});
