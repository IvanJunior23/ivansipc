// backend/app/controllers/authController.js
const authService = require("../services/authService")

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body
    if (!email || !senha) {
      return res.status(400).json({ success: false, message: "E-mail e senha são obrigatórios." })
    }

    const result = await authService.login(email, senha)
    res.json({ success: true, ...result })
  } catch (error) {
    // Envia uma resposta de não autorizado para erros de login
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

module.exports = { login, changePassword }
