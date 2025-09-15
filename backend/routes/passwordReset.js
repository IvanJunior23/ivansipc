const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Store reset codes temporarily
const resetCodes = new Map();
const tempUsers = new Map();
let transporter = null;
let emailConfigured = false;

// Configure Nodemailer
try {
  const nodemailer = require("nodemailer");
  
  if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
    console.log("🔧 Configurando SMTP...");
    
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Test connection
    transporter.verify(function (error, success) {
      if (error) {
        console.log("❌ SMTP connection failed:", error.message);
        console.log("💡 Dica: Verifique se a senha de app do Gmail está correta");
        emailConfigured = false;
      } else {
        console.log("✅ SMTP Server is ready to send emails");
        emailConfigured = true;
      }
    });
  } else {
    console.log("❌ SMTP não configurado - Variáveis necessárias:");
    console.log(" - SMTP_HOST:", process.env.SMTP_HOST ? '✓' : '❌');
    console.log(" - SMTP_USER:", process.env.SMTP_USER ? '✓' : '❌');
    console.log(" - SMTP_PASS:", process.env.SMTP_PASS ? '✓' : '❌');
    emailConfigured = false;
  }
} catch (error) {
  console.log("❌ Erro ao configurar nodemailer:", error.message);
  emailConfigured = false;
}

// Mock users for testing
async function findUserByEmail(email) {
  if (!tempUsers.has(email)) {
    // Add test users
    tempUsers.set('teste@teste.com', { 
      usuario_id: 1, 
      nome: 'Usuário Teste', 
      email: 'teste@teste.com' 
    });
    
    tempUsers.set(process.env.SMTP_USER, { 
      usuario_id: 2, 
      nome: 'Admin SIPC', 
      email: process.env.SMTP_USER 
    });
  }
  
  return tempUsers.get(email) || null;
}

// Mock password update
async function updateUserPassword(userId, hashedPassword) {
  console.log(`✅ Senha atualizada para usuário ID: ${userId}`);
  return true;
}

// Clean expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of resetCodes.entries()) {
    if (now > data.expires) {
      resetCodes.delete(email);
      console.log(`🗑️ Código expirado removido para: ${email}`);
    }
  }
}, 5 * 60 * 1000);

// Forgot password route
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("🔄 Processando solicitação de recuperação para:", req.body.email);
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "E-mail é obrigatório",
      });
    }
    
    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      console.log("❌ Usuário não encontrado para o e-mail:", email);
      return res.status(400).json({
        success: false,
        message: "E-mail não encontrado no sistema.",
      });
    }
    
    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code
    resetCodes.set(email, {
      code,
      expires: Date.now() + 15 * 60 * 1000,
      userId: user.usuario_id,
      attempts: 0
    });
    
    console.log("🔐 Código gerado:", code);
    
    // MODO TESTE - Se SMTP não configurado, retorna o código
    if (!emailConfigured || !transporter) {
      console.log(`🚨 MODO TESTE - Email: ${email} | Código: ${code}`);
      return res.json({
        success: true,
        message: `MODO TESTE: Use o código ${code} (verifique também o console do servidor)`,
      });
    }
    
    // Send email (código normal aqui...)
    
  } catch (error) {
    console.error("❌ Erro:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});


// Reset password route
router.post("/reset-password", async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body;
    
    // Validate required fields
    if (!email || !codigo || !novaSenha) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios",
      });
    }
    
    // Get reset data
    const resetData = resetCodes.get(email);
    if (!resetData) {
      return res.status(400).json({
        success: false,
        message: "Código não encontrado ou expirado. Solicite um novo código.",
      });
    }
    
    // Check expiration
    if (Date.now() > resetData.expires) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Código expirado. Solicite um novo código.",
      });
    }
    
    // Check attempts
    if (resetData.attempts >= 3) {
      resetCodes.delete(email);
      return res.status(429).json({
        success: false,
        message: "Muitas tentativas incorretas. Solicite um novo código.",
      });
    }
    
    // Validate code
    if (resetData.code !== codigo) {
      resetData.attempts++;
      return res.status(400).json({
        success: false,
        message: `Código inválido. Restam ${3 - resetData.attempts} tentativas.`,
      });
    }
    
    // Validate password length
    if (novaSenha.length < 6) {
      return res.status(400).json({
        success: false,
        message: "A senha deve ter pelo menos 6 caracteres",
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(novaSenha, 12);
    
    // Update password
    await updateUserPassword(resetData.userId, hashedPassword);
    
    // Clean up
    resetCodes.delete(email);
    
    console.log("✅ Senha alterada com sucesso para:", email);
    
    res.json({
      success: true,
      message: "Senha alterada com sucesso! Você já pode fazer login com a nova senha.",
    });
    
  } catch (error) {
    console.error("❌ Erro ao alterar senha:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor. Tente novamente.",
    });
  }
});

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Sistema de recuperação de senha funcionando!",
    smtpConfigured: emailConfigured,
    smtpUser: process.env.SMTP_USER,
    testUsers: Array.from(tempUsers.keys()),
    activeResetCodes: resetCodes.size
  });
});



module.exports = router;
