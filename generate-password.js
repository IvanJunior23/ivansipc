const bcrypt = require('bcryptjs');

async function gerarSenhaHash() {
    const senhaOriginal = '123456';
    
    console.log('🔐 Gerando hash para senha:', senhaOriginal);
    
    try {
        // Gerar hash com salt 10 (mesmo que seu sistema usa)
        const hash = await bcrypt.hash(senhaOriginal, 10);
        
        console.log('✅ Hash gerado:', hash);
        console.log('📏 Tamanho do hash:', hash.length);
        
        // Testar se o hash funciona
        const teste = await bcrypt.compare(senhaOriginal, hash);
        console.log('🔍 Teste de verificação:', teste ? '✅ VÁLIDO' : '❌ INVÁLIDO');
        
        // SQL pronto para executar
        console.log('\n📋 Execute este SQL no MySQL:');
        console.log('----------------------------------------');
        console.log(`UPDATE usuario SET senha = '${hash}' WHERE email = 'admin@sipc.com';`);
        console.log('----------------------------------------');
        
        // Verificar no banco depois
        console.log('\n🔍 Para verificar depois, execute:');
        console.log(`SELECT usuario_id, email, senha FROM usuario WHERE email = 'admin@sipc.com';`);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

gerarSenhaHash();
