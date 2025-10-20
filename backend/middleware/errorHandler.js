// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.stack)

  // Default error
  const error = {
    message: err.message || "Erro interno do servidor",
    status: err.status || 500,
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message)
    error.message = messages.join(", ")
    error.status = 400
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error.message = "Recurso já existe"
    error.status = 400
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Token inválido"
    error.status = 401
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expirado"
    error.status = 401
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
  })
}

module.exports = errorHandler
