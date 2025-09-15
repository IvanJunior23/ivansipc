const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../config/database")
const authController = require("../app/controllers/authController")
const passwordResetController = require("../app/controllers/passwordResetController")
const { authenticateToken, authorizeRole, validatePasswordChange } = require("../middleware/auth")
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt")
const router = express.Router()

router.post("/login", authController.login)

router.post("/change-password", authenticateToken, validatePasswordChange, authController.changePassword)

router.post("/forgot-password", passwordResetController.forgotPassword)
router.post("/reset-password", passwordResetController.resetPassword)

// Verificar token
router.get("/verificar", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      usuario_id: req.user.id,
      email: req.user.email,
      tipo: req.user.tipo_usuario,
      nome: req.user.nome,
    },
  })
})

// Refresh token
router.post("/refresh", authenticateToken, (req, res) => {
  const newToken = jwt.sign(
    {
      id: req.user.id,
      nome: req.user.nome,
      tipo_usuario: req.user.tipo_usuario,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )

  console.log("🔄 Token refreshed:", {
    userId: req.user.id,
    tokenLength: newToken.length,
    expiresIn: JWT_EXPIRES_IN,
  })

  res.json({
    success: true,
    token: newToken,
  })
})

// Logout
router.post("/logout", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Logout realizado com sucesso",
  })
})

router.get("/test", (req, res) => {
  res.json({ success: true, message: "Rota de auth funcionando!" })
})

// Debug route - adicionar antes do module.exports
router.get("/debug-login/:email", async (req, res) => {
  try {
    const userModel = require("../app/models/userModel");
    const bcrypt = require("bcryptjs");
    
    const email = req.params.email;
    const user = await userModel.findByEmail(email);
    
    if (!user) {
      return res.json({ found: false, email });
    }
    
    // Testar senhas comuns
    const senhasComuns = ['123456', 'admin', 'password', 'sipc123'];
    const resultados = {};
    
    for (const senha of senhasComuns) {
      try {
        const bcryptResult = await bcrypt.compare(senha, user.senha);
        const plainResult = (senha === user.senha);
        
        resultados[senha] = {
          bcrypt: bcryptResult,
          plain: plainResult
        };
      } catch (error) {
        resultados[senha] = { error: error.message };
      }
    }
    
    res.json({
      found: true,
      user: {
        id: user.usuario_id,
        nome: user.nome,
        email: user.email,
        status: user.status,
        senhaHash: user.senha?.substring(0, 20) + "...",
        senhaLength: user.senha?.length
      },
      testResults: resultados
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router
