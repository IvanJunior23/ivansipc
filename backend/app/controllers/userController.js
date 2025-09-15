const userService = require('../services/userService');

const listUsers = async (req, res, next) => {
    try {
        const users = await userService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const result = await userService.createUser(req.body);
        res.status(201).json({ success: true, ...result, message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const updateUser = async (req, res, next) => {
    try {
        const result = await userService.updateUser(req.params.id, req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const toggleUserStatus = async (req, res, next) => {
    try {
        const result = await userService.toggleUserStatus(req.params.id);
        res.json({ success: true, ...result });
    } catch (error) {
         res.status(404).json({ success: false, error: error.message });
    }
};

module.exports = { listUsers, createUser, updateUser, toggleUserStatus };
