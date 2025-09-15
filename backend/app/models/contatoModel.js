// backend/app/models/contatoModel.js
const { pool } = require('../../config/database');

// Buscar TODOS os contatos (ativos e inativos) - conforme solicitado
const findAll = async () => {
    const query = `
        SELECT contato_id, nome_completo, telefone, email, status as ativo,
               created_at, updated_at, created_by
        FROM contato
        ORDER BY nome_completo
    `;
    console.log('🔍 Model: executando query findAll');
    const [rows] = await pool.execute(query);
    console.log('🔍 Model: encontrados', rows.length, 'contatos');
    return rows;
};

// Buscar contatos por usuário (mantendo para compatibilidade futura)
const findByUserId = async (userId) => {
    const query = `
        SELECT contato_id, nome_completo, telefone, email, status as ativo,
               created_at, updated_at, created_by
        FROM contato
        WHERE created_by = ?
        ORDER BY nome_completo
    `;
    console.log('🔍 Model: buscando contatos do usuário:', userId);
    const [rows] = await pool.execute(query, [userId]);
    return rows;
};

// Buscar um contato específico por ID
const findById = async (id) => {
    const query = `
        SELECT contato_id, nome_completo, telefone, email, status as ativo,
               created_at, updated_at, created_by
        FROM contato
        WHERE contato_id = ?
    `;
    console.log('🔍 Model: buscando contato por ID:', id);
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
};

// Buscar um contato específico do usuário (mantendo para compatibilidade)
const findByIdAndUserId = async (id, userId) => {
    const query = `
        SELECT contato_id, nome_completo, telefone, email, status as ativo,
               created_at, updated_at, created_by
        FROM contato
        WHERE contato_id = ? AND created_by = ?
    `;
    console.log('🔍 Model: buscando contato ID:', id, 'do usuário:', userId);
    const [rows] = await pool.execute(query, [id, userId]);
    return rows[0] || null;
};

const create = async (contatoData) => {
    const { nome_completo, telefone, email, usuario_id } = contatoData;
    
    console.log('➕ Model: criando contato:', { nome_completo, telefone, email, usuario_id });
    
    const query = `
        INSERT INTO contato (nome_completo, telefone, email, created_by, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
    `;
    
    const [result] = await pool.execute(query, [
        nome_completo, 
        telefone, 
        email || null, 
        usuario_id || null
    ]);
    
    console.log('✅ Model: contato criado com ID:', result.insertId);
    
    // Retornar o contato criado completo
    return await findById(result.insertId);
};

const update = async (id, contatoData) => {
    console.log('🔄 Model: atualizando contato ID:', id, 'com dados:', contatoData);
    
    // Construir query dinamicamente baseado nos campos fornecidos
    const campos = [];
    const valores = [];
    
    if (contatoData.nome_completo !== undefined) {
        campos.push('nome_completo = ?');
        valores.push(contatoData.nome_completo);
    }
    
    if (contatoData.telefone !== undefined) {
        campos.push('telefone = ?');
        valores.push(contatoData.telefone);
    }
    
    if (contatoData.email !== undefined) {
        campos.push('email = ?');
        valores.push(contatoData.email);
    }
    
    // Campo status/ativo
    if (contatoData.ativo !== undefined) {
        campos.push('status = ?');
        // Converter para boolean correto para MySQL
        const statusValue = contatoData.ativo === true || contatoData.ativo === 1 || contatoData.ativo === '1';
        valores.push(statusValue);
    }
    
    if (campos.length === 0) {
        throw new Error('Nenhum campo fornecido para atualização');
    }
    
    // Sempre atualizar o updated_at
    campos.push('updated_at = NOW()');
    valores.push(id); // ID vai por último
    
    const query = `
        UPDATE contato
        SET ${campos.join(', ')}
        WHERE contato_id = ?
    `;
    
    console.log('🔄 Model: executando query:', query);
    console.log('🔄 Model: com valores:', valores);
    
    const [result] = await pool.execute(query, valores);
    
    if (result.affectedRows === 0) {
        throw new Error('Contato não encontrado ou não foi possível atualizar');
    }
    
    console.log('✅ Model: contato atualizado, linhas afetadas:', result.affectedRows);
    
    // Retornar o contato atualizado
    return await findById(id);
};

// Método específico para alterar apenas o status
const updateStatus = async (id, ativo) => {
    console.log('🔄 Model: alterando status do contato ID:', id, 'para:', ativo);
    
    const statusValue = ativo === true || ativo === 1 || ativo === '1';
    
    const query = `
        UPDATE contato
        SET status = ?, updated_at = NOW()
        WHERE contato_id = ?
    `;
    
    console.log('🔄 Model: executando updateStatus com valor:', statusValue);
    
    const [result] = await pool.execute(query, [statusValue, id]);
    
    if (result.affectedRows === 0) {
        throw new Error('Contato não encontrado');
    }
    
    console.log('✅ Model: status alterado, linhas afetadas:', result.affectedRows);
    
    // Retornar o contato atualizado
    return await findById(id);
};

// Manter o remove para compatibilidade (mas renomear para soft delete)
const softDelete = async (id) => {
    console.log('🗑️ Model: fazendo soft delete do contato ID:', id);
    
    const query = `
        UPDATE contato 
        SET status = FALSE, updated_at = NOW() 
        WHERE contato_id = ?
    `;
    
    const [result] = await pool.execute(query, [id]);
    console.log('✅ Model: soft delete executado, linhas afetadas:', result.affectedRows);
    
    return result;
};

module.exports = {
    findAll,
    findByUserId,
    findById,          // Novo método
    findByIdAndUserId,
    create,
    update,
    updateStatus,      // Novo método específico para status
    softDelete,        // Renomeado de remove
    remove: softDelete // Alias para compatibilidade
};
