const userService = require("../services/userService")

const listUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers()
    res.json({ success: true, data: users })
  } catch (error) {
    next(error)
  }
}

const createUser = async (req, res, next) => {
  try {
    console.log("[DEBUG] === INÍCIO CREATE USER ===")
    console.log("[DEBUG] Dados recebidos no controller:", req.body)
    console.log("[DEBUG] Headers:", req.headers)
    console.log("[DEBUG] User do token:", req.user)

    if (!req.body) {
      console.log("[ERROR] Body vazio")
      return res.status(400).json({ success: false, error: "Dados não fornecidos" })
    }

    console.log("[DEBUG] Chamando userService.createUser...")
    const result = await userService.createUser(req.body)
    console.log("[DEBUG] Resultado do service:", result)

    console.log("[DEBUG] === SUCESSO CREATE USER ===")
    res.status(201).json({ success: true, ...result, message: "Usuário criado com sucesso!" })
  } catch (error) {
    console.error("[ERROR] === ERRO NO CREATE USER ===")
    console.error("[ERROR] Tipo do erro:", typeof error)
    console.error("[ERROR] Erro no createUser controller:", error.message)
    console.error("[ERROR] Stack completo:", error.stack)
    console.error("[ERROR] Dados que causaram erro:", req.body)

    if (!res.headersSent) {
      res.status(400).json({ success: false, error: error.message || "Erro interno do servidor" })
    }
  }
}

const updateUser = async (req, res, next) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}

const toggleUserStatus = async (req, res, next) => {
  try {
    const result = await userService.toggleUserStatus(req.params.id)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(404).json({ success: false, error: error.message })
  }
}

module.exports = { listUsers, createUser, updateUser, toggleUserStatus }
