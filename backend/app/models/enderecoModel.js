// backend/app/models/enderecoModel.js
const { pool } = require('../../config/database');

const findAll = async () => {
    // Buscar TODOS os endereços (ativos e inativos) para permitir gerenciamento
    const [rows] = await pool.execute(`
        SELECT endereco_id, logradouro, numero, complemento, bairro, cidade, estado, cep, status, 
               created_at, updated_at, created_by, updated_by
        FROM endereco 
        ORDER BY logradouro, numero
    `);
    return rows;
};

const create = async (addressData) => {
    const { logradouro, numero, complemento, bairro, cidade, estado, cep, created_by } = addressData;
    const query = `
        INSERT INTO endereco (logradouro, numero, complemento, bairro, cidade, estado, cep, status, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)
    `;
    const [result] = await pool.execute(query, [
        logradouro, numero, complemento, bairro, cidade, estado, cep, created_by
    ]);
    return { id: result.insertId };
};

const update = async (id, addressData) => {
    const { logradouro, numero, complemento, bairro, cidade, estado, cep, updated_by } = addressData;
    const query = `
        UPDATE endereco 
        SET logradouro=?, numero=?, complemento=?, bairro=?, cidade=?, estado=?, cep=?, updated_by=?, updated_at=CURRENT_TIMESTAMP 
        WHERE endereco_id = ?
    `;
    const [result] = await pool.execute(query, [
        logradouro, numero, complemento, bairro, cidade, estado, cep, updated_by, id
    ]);
    return result;
};

// Método para soft delete (manter compatibilidade)
const remove = async (id) => {
    const [result] = await pool.execute("UPDATE endereco SET status = FALSE WHERE endereco_id = ?", [id]);
    return result;
};

// Novo método específico para alteração de status
const updateStatus = async (id, status) => {
    const query = "UPDATE endereco SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE endereco_id = ?";
    const [result] = await pool.execute(query, [status, id]);
    return result;
};

module.exports = { findAll, create, update, remove, updateStatus };
