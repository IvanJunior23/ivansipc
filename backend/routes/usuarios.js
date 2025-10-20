// Arquivo: routes/usuarios.js (VERSÃO CORRIGIDA)

const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const { pool } = require("../config/database")
const { authenticateToken, authorizeRole } = require("../middleware/auth")
const { validateUserCreation, validateUserUpdate } = require("../middleware/validation")

// GET /api/usuarios - Listar todos os usuários
router.get("/", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    console.log("[DEBUG] GET /api/usuarios - User info:", {
      userId: req.user?.id,
      userType: req.user?.tipo_usuario,
      timestamp: new Date().toISOString(),
    })

    const [rows] = await pool.execute(`
            SELECT 
                u.usuario_id as id,
                u.pessoa_id,
                p.nome,
                u.email,
                u.tipo_usuario as tipo,
                u.status as ativo
            FROM usuario u
            JOIN pessoa p ON u.pessoa_id = p.pessoa_id
            ORDER BY p.nome ASC
        `)

    // O MySQL retorna 0 ou 1 para BOOLEAN, vamos converter para true/false
    const usuariosFormatados = rows.map((user) => ({
      ...user,
      ativo: Boolean(user.ativo),
    }))

    console.log("[DEBUG] Found users:", usuariosFormatados.length)
    res.json({ success: true, data: usuariosFormatados })
  } catch (error) {
    console.error("❌ Erro ao buscar usuários:", error)
    res.status(500).json({ success: false, error: "Erro interno do servidor" })
  }
})

// POST /api/usuarios - Criar novo usuário
router.post("/", authenticateToken, authorizeRole("admin"), validateUserCreation, async (req, res) => {
  try {
    const { pessoa_id, email, tipo_usuario, senha } = req.body

    console.log("[DEBUG] POST /api/usuarios - Data received:", {
      pessoa_id,
      email,
      tipo_usuario,
      hasSenha: !!senha,
      timestamp: new Date().toISOString(),
    })

    // Check if email already exists
    const [existing] = await pool.execute("SELECT usuario_id FROM usuario WHERE email = ?", [email.toLowerCase()])
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: ["E-mail já está em uso"],
      })
    }

    const [pessoa] = await pool.execute("SELECT pessoa_id, nome FROM pessoa WHERE pessoa_id = ? AND status = 1", [
      pessoa_id,
    ])
    if (pessoa.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: ["Pessoa não encontrada ou inativa"],
      })
    }

    const [existingUser] = await pool.execute("SELECT usuario_id FROM usuario WHERE pessoa_id = ?", [pessoa_id])
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: ["Esta pessoa já possui um usuário associado"],
      })
    }

    const hashedPassword = await bcrypt.hash(senha.trim(), 10)

    const [usuarioResult] = await pool.execute(
      "INSERT INTO usuario (pessoa_id, email, senha, tipo_usuario, status) VALUES (?, ?, ?, ?, 1)",
      [pessoa_id, email.toLowerCase().trim(), hashedPassword, tipo_usuario],
    )

    console.log("[DEBUG] User created successfully:", usuarioResult.insertId)

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      data: { id: usuarioResult.insertId },
    })
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error)
    res.status(500).json({ success: false, error: "Erro interno do servidor" })
  }
})

// PUT /api/usuarios/:id - Atualizar usuário
router.put("/:id", authenticateToken, authorizeRole("admin"), validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, email, tipo_usuario, senha } = req.body

    console.log("[DEBUG] PUT /api/usuarios/:id - Data received:", {
      id,
      nome,
      email,
      tipo_usuario,
      hasSenha: !!senha,
      timestamp: new Date().toISOString(),
    })

    if (email) {
      const [existing] = await pool.execute("SELECT usuario_id FROM usuario WHERE email = ? AND usuario_id != ?", [
        email.toLowerCase(),
        id,
      ])
      if (existing.length > 0) {
        console.log("[DEBUG] Email already exists for another user")
        return res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: ["E-mail já está em uso por outro usuário"],
        })
      }
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Get pessoa_id from usuario
      const [userRows] = await connection.execute("SELECT pessoa_id FROM usuario WHERE usuario_id = ?", [id])
      if (userRows.length === 0) {
        console.log("[DEBUG] User not found:", id)
        return res.status(404).json({ success: false, error: "Usuário não encontrado" })
      }
      const pessoaId = userRows[0].pessoa_id

      // Update pessoa table
      if (nome) {
        console.log("[DEBUG] Updating pessoa name:", nome)
        await connection.execute("UPDATE pessoa SET nome = ? WHERE pessoa_id = ?", [nome.trim(), pessoaId])
      }

      // Update usuario table
      const userFields = []
      const userValues = []
      if (email) {
        userFields.push("email = ?")
        userValues.push(email.toLowerCase().trim())
      }
      if (tipo_usuario) {
        userFields.push("tipo_usuario = ?")
        userValues.push(tipo_usuario)
      }
      if (senha && senha.trim()) {
        const hashedPassword = await bcrypt.hash(senha.trim(), 10)
        userFields.push("senha = ?")
        userValues.push(hashedPassword)
      }

      if (userFields.length > 0) {
        userValues.push(id)
        const usuarioQuery = `UPDATE usuario SET ${userFields.join(", ")} WHERE usuario_id = ?`
        console.log("[DEBUG] Executing usuario update query:", usuarioQuery)
        await connection.execute(usuarioQuery, userValues)
      }

      await connection.commit()
      console.log("[DEBUG] User updated successfully:", id)
      res.json({ success: true, message: "Usuário atualizado com sucesso" })
    } catch (error) {
      await connection.rollback()
      console.error("[DEBUG] Error in transaction:", error)
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error)
    res.status(500).json({ success: false, error: "Erro interno do servidor" })
  }
})

// DELETE /api/usuarios/:id - Desativar/Ativar usuário
router.delete("/:id", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { id } = req.params
    if (Number.parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, error: "Você não pode desativar seu próprio usuário" })
    }
    const [user] = await pool.execute("SELECT status FROM usuario WHERE usuario_id = ?", [id])
    if (user.length === 0) {
      return res.status(404).json({ success: false, error: "Usuário não encontrado" })
    }
    const novoStatus = !user[0].status
    await pool.execute("UPDATE usuario SET status = ? WHERE usuario_id = ?", [novoStatus, id])
    const acao = novoStatus ? "ativado" : "desativado"
    res.json({ success: true, message: `Usuário ${acao} com sucesso` })
  } catch (error) {
    console.error("❌ Erro ao alterar status do usuário:", error)
    res.status(500).json({ success: false, error: "Erro interno do servidor" })
  }
})

module.exports = router
