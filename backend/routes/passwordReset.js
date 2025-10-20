const express = require("express")
const router = express.Router()
const { forgotPassword, resetPassword } = require("../app/controllers/passwordResetController")

// Forgot password route
router.post("/forgot-password", forgotPassword)

// Reset password route
router.post("/reset-password", resetPassword)

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Sistema de recuperação de senha funcionando!",
    info: "Usando controller real com banco de dados",
  })
})

module.exports = router
