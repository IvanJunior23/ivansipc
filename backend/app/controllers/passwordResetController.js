const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const UserModel = require("../models/userModel")

// Store reset codes temporarily (in production, use Redis or database)
const resetCodes = new Map()
let transporter = null
let emailConfigured = false

try {
  const nodemailer = require("nodemailer")
  
  // Check if SMTP configuration is available
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Para desenvolvimento
      }
    })

    // Verify connection configuration
    transporter.verify(function (error, success) {
      if (error) {
        console.log("❌ SMTP connection failed:", error.message)
        emailConfigured = false
      } else {
        console.log("✅ SMTP Server is ready to take our messages")
        emailConfigured = true
      }
    })
  } else {
    console.log("⚠️ SMTP credentials not configured - email functionality disabled")
  }
} catch (error) {
  console.log("⚠️ Nodemailer not available - email functionality disabled:", error.message)
}

// Clean expired codes every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [email, data] of resetCodes.entries()) {
    if (now > data.expires) {
      resetCodes.delete(email)
      console.log(`🗑️ Cleaned expired reset code for: ${email}`)
    }
  }
}, 5 * 60 * 1000)

const forgotPassword = async (req, res) => {
  try {
    console.log("🔄 Processing forgot password request for:", req.body.email)
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "E-mail é obrigatório",
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Formato de e-mail inválido",
      })
    }

    // Check if user exists
    const user = await UserModel.findByEmail(email)
    if (!user) {
      console.log("❌ User not found for email:", email)
      return res.status(404).json({
        success: false,
        message: "E-mail não encontrado",
      })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store code with expiration (15 minutes)
    resetCodes.set(email, {
      code,
      expires: Date.now() + 15 * 60 * 1000,
      userId: user.usuario_id,
      attempts: 0 // Track failed attempts
    })

    if (!emailConfigured) {
      console.log("⚠️ Email not configured - showing code directly for development")
      return res.json({
        success: true,
        message: "E-mail não configurado. Use o código abaixo:",
        developmentMode: true,
        code: code,
        warning: "ATENÇÃO: Em produção, configure o SMTP para envio por e-mail",
      })
    }

    console.log("📧 Sending reset code to:", email)
    
    // Send email
    const mailOptions = {
      from: `"SIPC Sistema" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "SIPC - Código de Recuperação de Senha",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1ABC9C; margin: 0;">
              <span style="font-size: 32px;">🔧</span> SIPC
            </h1>
            <p style="color: #666; margin: 5px 0;">Sistema de Inventário de Peças para Computadores</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #1ABC9C, #16a085); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0;">Recuperação de Senha</h2>
            <p style="margin: 0; opacity: 0.9;">Use o código abaixo para alterar sua senha</p>
          </div>
          
          <div style="background-color: #f8f9fa; border: 2px dashed #1ABC9C; padding: 30px; text-align: center; margin: 30px 0; border-radius: 10px;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">SEU CÓDIGO DE VERIFICAÇÃO:</p>
            <h1 style="color: #1ABC9C; font-size: 42px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</h1>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⏰ Este código expira em 15 minutos.</strong>
            </p>
          </div>
          
          <div style="color: #666; font-size: 14px; line-height: 1.5;">
            <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
            <p>Por segurança, nunca compartilhe este código com outras pessoas.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>Este é um e-mail automático, não responda.</p>
            <p>© ${new Date().getFullYear()} SIPC - Todos os direitos reservados</p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("✅ Reset code sent successfully to:", email)

    res.json({
      success: true,
      message: "Código enviado para seu e-mail",
    })
  } catch (error) {
    console.error("❌ Erro ao enviar código de recuperação:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao enviar e-mail. Tente novamente em alguns minutos.",
    })
  }
}

const resetPassword = async (req, res) => {
  try {
    console.log("🔄 Processing password reset for:", req.body.email)
    const { email, codigo, novaSenha } = req.body

    if (!email || !codigo || !novaSenha) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios",
      })
    }

    // Check if code exists and is valid
    const resetData = resetCodes.get(email)
    if (!resetData) {
      console.log("❌ Reset code not found for email:", email)
      return res.status(400).json({
        success: false,
        message: "Código não encontrado ou expirado",
      })
    }

    // Check if code is expired
    if (Date.now() > resetData.expires) {
      resetCodes.delete(email)
      console.log("❌ Reset code expired for email:", email)
      return res.status(400).json({
        success: false,
        message: "Código expirado. Solicite um novo código.",
      })
    }

    // Check attempts limit
    if (resetData.attempts >= 3) {
      resetCodes.delete(email)
      return res.status(429).json({
        success: false,
        message: "Muitas tentativas incorretas. Solicite um novo código.",
      })
    }

    // Check if code matches
    if (resetData.code !== codigo) {
      resetData.attempts++
      console.log(`❌ Invalid reset code for email: ${email} (attempt ${resetData.attempts})`)
      return res.status(400).json({
        success: false,
        message: `Código inválido. Restam ${3 - resetData.attempts} tentativas.`,
      })
    }

    // Validate password length
    if (novaSenha.length < 6) {
      return res.status(400).json({
        success: false,
        message: "A senha deve ter pelo menos 6 caracteres",
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(novaSenha, 12)
    
    // Update user password
    await UserModel.updatePassword(resetData.userId, hashedPassword)
    
    // Remove used code
    resetCodes.delete(email)
    
    console.log("✅ Password reset successfully for user:", resetData.userId)

    res.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao alterar senha:", error)
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
}

module.exports = {
  forgotPassword,
  resetPassword,
}
