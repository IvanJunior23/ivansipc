const express = require("express")
const router = express.Router()
const UsuarioController = require("../app/controllers/usuarioController")
const bcrypt = require("bcryptjs")
const { pool } = require("../config/database")
const { authenticateToken, authorizeRole } = require("../middleware/auth")
const { validateUserCreation, validateUserUpdate } = require("../middleware/validation")

router.use(authenticateToken)
router.use(authorizeRole("admin"))

// GET /api/usuarios - Listar todos os usuários
router.get("/", UsuarioController.listar)

// POST /api/usuarios - Criar novo usuário
router.post("/", validateUserCreation, UsuarioController.criar)

// GET /api/usuarios/:id - Buscar usuário por ID
router.get("/:id", UsuarioController.buscarPorId)

// PUT /api/usuarios/:id - Atualizar usuário
router.put("/:id", validateUserUpdate, UsuarioController.atualizar)

// DELETE /api/usuarios/:id - Desativar/Ativar usuário
router.delete("/:id", UsuarioController.inativar)

// PATCH /api/usuarios/:id/status - Toggle status do usuário
router.patch("/:id/status", UsuarioController.toggleStatus)

module.exports = router
