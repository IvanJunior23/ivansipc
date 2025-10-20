const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../config/jwt")
const { logTokenAnalysis } = require("../utils/jwtValidator")
const jwtDebugger = require("../utils/jwtDebugger")

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]

  jwtDebugger.log("INFO", "Authentication request received", {
    url: req.url,
    method: req.method,
    hasAuthHeader: !!authHeader,
    userAgent: req.headers["user-agent"]?.substring(0, 50),
    contentType: req.headers["content-type"],
  })

  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    jwtDebugger.log("ERROR", "No token provided", { authHeader })
    return res.status(401).json({
      success: false,
      error: "Token de acesso não fornecido",
    })
  }

  try {
    console.log(" Middleware: iniciando verificação do token")
    const decoded = jwtDebugger.debugTokenVerification(token, JWT_SECRET)

    console.log(" Middleware: token verificado com sucesso, decoded:", decoded)

    if (!decoded || !decoded.id) {
      console.error(" Middleware: token decodificado não contém ID do usuário:", decoded)
      throw new Error("Token decodificado inválido - ID do usuário não encontrado")
    }

    jwtDebugger.log("SUCCESS", "Token authentication successful", {
      userId: decoded.id,
      userType: decoded.tipo_usuario,
      url: req.url,
      method: req.method,
    })

    req.user = decoded
    console.log(" Middleware: req.user definido:", req.user)
    console.log(" Middleware: chamando next()")
    next()
  } catch (err) {
    console.error(" Middleware: erro na verificação do token:", err)
    jwtDebugger.log("ERROR", "Token authentication failed", {
      error: err.message,
      errorName: err.name,
      url: req.url,
      method: req.method,
      tokenPreview: token.substring(0, 20) + "...",
    })

    // Provide more specific error messages
    let errorMessage = "Token inválido"
    if (err.name === "TokenExpiredError") {
      errorMessage = "Token expirado"
    } else if (err.name === "JsonWebTokenError") {
      errorMessage = "Token malformado"
    }

    return res.status(403).json({
      success: false,
      error: errorMessage,
    })
  }
}

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      })
    }

    console.log("[DEBUG] Authorization check:", {
      userType: req.user.tipo_usuario,
      requiredRoles: roles,
      hasAccess: roles.includes(req.user.tipo_usuario),
      url: req.originalUrl,
      method: req.method,
    })

    if (!roles.includes(req.user.tipo_usuario)) {
      console.log("❌ Acesso negado:", { userType: req.user.tipo_usuario, requiredRoles: roles })
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      })
    }

    next()
  }
}

const validatePasswordChange = (req, res, next) => {
  const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body
  const errors = []

  if (!senhaAtual || !senhaAtual.trim()) {
    errors.push("Senha atual é obrigatória")
  }

  if (!novaSenha || !novaSenha.trim()) {
    errors.push("Nova senha é obrigatória")
  } else {
    if (novaSenha.trim().length < 6) {
      errors.push("Nova senha deve ter pelo menos 6 caracteres")
    }

    if (novaSenha.trim() === senhaAtual?.trim()) {
      errors.push("Nova senha deve ser diferente da senha atual")
    }
  }

  if (!confirmarNovaSenha || !confirmarNovaSenha.trim()) {
    errors.push("Confirmação da nova senha é obrigatória")
  } else if (novaSenha?.trim() !== confirmarNovaSenha.trim()) {
    errors.push("Confirmação da nova senha não confere")
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

module.exports = { authenticateToken, authorizeRole, validatePasswordChange }
