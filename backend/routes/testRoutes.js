const express = require("express")
const router = express.Router()
const nodemailer = require("nodemailer")

// Configurar transporter (mesmo código do controller)
let transporter = null
let emailConfigured = false

try {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    transporter.verify((error, success) => {
      if (error) {
        console.log("❌ SMTP connection failed:", error.message)
        emailConfigured = false
      } else {
        console.log("✅ SMTP Server is ready for testing")
        emailConfigured = true
      }
    })
  } else {
    console.log("⚠️ SMTP credentials not configured")
  }
} catch (error) {
  console.log("⚠️ Error setting up test transporter:", error.message)
}

// Rota para testar configuração SMTP
router.get("/test-email", async (req, res) => {
  try {
    console.log("🧪 Testing SMTP configuration...")

    if (!emailConfigured || !transporter) {
      return res.status(400).json({
        success: false,
        message: "SMTP não configurado ou com erro",
        config: {
          host: process.env.SMTP_HOST || "Not set",
          port: process.env.SMTP_PORT || "Not set",
          user: process.env.SMTP_USER ? "✓ Configured" : "❌ Not set",
          pass: process.env.SMTP_PASS ? "✓ Configured" : "❌ Not set",
          from: process.env.SMTP_FROM || "Not set",
        },
      })
    }

    // E-mail de destino (pode ser passado como query param ou usar o próprio SMTP_USER)
    const testEmail = req.query.email || process.env.SMTP_USER

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: "E-mail de destino não especificado. Use ?email=seuemail@exemplo.com",
      })
    }

    const mailOptions = {
      from: `"SIPC Teste" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: testEmail,
      subject: "SIPC - Teste de Configuração SMTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1ABC9C;">🧪 TESTE SMTP - SIPC</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #1ABC9C, #16a085); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0;">✅ Configuração SMTP Funcionando!</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Se você recebeu este e-mail, sua configuração está correta.</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Informações da Configuração:</h3>
            <ul style="color: #666;">
              <li><strong>Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>Porta:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>Usuário:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</li>
            </ul>
          </div>
          
          <div style="color: #666; font-size: 14px;">
            <p>Este é um e-mail de teste automático do sistema SIPC.</p>
            <p>Agora você pode usar a funcionalidade de recuperação de senha com segurança!</p>
          </div>
        </div>
      `,
    }

    console.log(`📧 Sending test email to: ${testEmail}`)
    await transporter.sendMail(mailOptions)

    console.log("✅ Test email sent successfully!")
    res.json({
      success: true,
      message: `E-mail de teste enviado com sucesso para ${testEmail}!`,
      timestamp: new Date().toISOString(),
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
      },
    })
  } catch (error) {
    console.error("❌ Error sending test email:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao enviar e-mail de teste",
      error: error.message,
      details: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
      },
    })
  }
})

// Rota para verificar status da configuração SMTP
router.get("/smtp-status", (req, res) => {
  res.json({
    emailConfigured,
    config: {
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || null,
      user: process.env.SMTP_USER ? "✓ Configured" : "❌ Not configured",
      pass: process.env.SMTP_PASS ? "✓ Configured" : "❌ Not configured",
      from: process.env.SMTP_FROM || null,
    },
    status: emailConfigured ? "ready" : "not configured",
  })
})

// Rota para testar diferentes configurações SMTP
router.post("/test-smtp-config", async (req, res) => {
  try {
    const { host, port, user, pass, testEmail } = req.body

    if (!host || !port || !user || !pass || !testEmail) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios: host, port, user, pass, testEmail",
      })
    }

    // Criar transporter temporário para teste
    const testTransporter = nodemailer.createTransport({
      host,
      port: Number.parseInt(port),
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    })

    // Verificar conexão
    await testTransporter.verify()

    // Enviar e-mail de teste
    await testTransporter.sendMail({
      from: `"SIPC Teste Config" <${user}>`,
      to: testEmail,
      subject: "SIPC - Teste de Nova Configuração SMTP",
      text: "Se você recebeu este e-mail, a nova configuração SMTP está funcionando!",
    })

    res.json({
      success: true,
      message: "Configuração testada com sucesso! E-mail enviado.",
      config: { host, port, user: user.substring(0, 3) + "***" },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erro na configuração SMTP",
      error: error.message,
    })
  }
})

module.exports = router
