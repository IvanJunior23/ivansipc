const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { pool } = require('../../config/database');

const getAllUsers = async () => {
    return await userModel.findAll();
};

const createUser = async (userData) => {
    const { email, senha } = userData;
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
        throw new Error('E-mail já está em uso');
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const newUserId = await userModel.create({ ...userData, senhaCriptografada }, connection);
        await connection.commit();
        return { id: newUserId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const updateUser = async (id, userData) => {
    if (userData.senha) {
        userData.senhaCriptografada = await bcrypt.hash(userData.senha, 10);
        delete userData.senha;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await userModel.update(id, userData, connection);
        await connection.commit();
        return { message: 'Usuário atualizado com sucesso' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const toggleUserStatus = async (id) => {
    const result = await userModel.toggleStatus(id);
    if (result.affectedRows === 0) {
        throw new Error('Usuário não encontrado');
    }
    return { message: 'Status do usuário alterado com sucesso' };
};

module.exports = { getAllUsers, createUser, updateUser, toggleUserStatus };
