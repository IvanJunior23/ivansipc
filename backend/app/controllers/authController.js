// backend/app/controllers/authController.js
const authService = require("../services/authService")
const logService = require("../services/logService")

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body
    if (!email || !senha) {
      return res.status(400).json({ success: false, message: "E-mail e senha são obrigatórios." })
    }

    const result = await authService.login(email, senha)

    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null)

    try {
      await logService.logLogin(result.user.usuario_id, ipAddress, `Login realizado com sucesso para ${email}`)
    } catch (logError) {
      console.error("Erro ao registrar log de login bem-sucedido:", logError)
    }

    res.json({ success: true, ...result })
  } catch (error) {
    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null)

    try {
      await logService.createLog({
        usuario_id: null,
        acao: "LOGIN",
        detalhes: `Tentativa de login falhada para ${req.body.email || "email não informado"}: ${error.message}`,
        ip_origem: ipAddress,
      })
    } catch (logError) {
      console.error("Erro ao registrar tentativa de login falhada:", logError)
    }

    res.status(401).json({ success: false, message: error.message })
  }
}

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id // From JWT token
    const { senhaAtual, novaSenha } = req.body

    const result = await authService.changePassword(userId, senhaAtual, novaSenha)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}

const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.usuario_id
    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null)

    if (userId) {
      await logService.logLogout(userId, ipAddress, "Usuário fez logout do sistema")
    }

    res.json({ success: true, message: "Logout realizado com sucesso" })
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    res.status(500).json({ success: false, message: "Erro interno do servidor" })
  }
}

module.exports = { login, changePassword, logout }
