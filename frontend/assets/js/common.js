// Local: frontend/assets/js/common.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof auth === 'undefined') {
        console.error('auth.js precisa ser carregado antes de common.js');
        return;
    }

    // --- PONTO CRÍTICO PARA O FLUXO DE LOGIN ---
    // Verifica a autenticação em todas as páginas que incluem este script
    if (!auth.isAuthenticated()) {
        // Se não estiver autenticado, volta para a tela de login
        window.location.href = '/login.html';
        return; // Para a execução do script para evitar erros
    }

    // Se a verificação passar, continua para construir o menu lateral
    buildSidebar();
});

async function buildSidebar() {
    const user = await auth.getCurrentUser();
    const sidebarMenu = document.getElementById('sidebar-menu');
    // ... resto da sua função buildSidebar
}
