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

  // MySQL duplicate entry error
  if (err.code === "ER_DUP_ENTRY") {
    error.message = "Registro duplicado. Este item já existe no sistema."
    error.status = 409
  }

  // MySQL foreign key constraint error
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    error.message = "Não é possível excluir este registro pois ele está sendo usado em outros lugares."
    error.status = 409
  }

  // MySQL connection error
  if (err.code === "ECONNREFUSED" || err.code === "PROTOCOL_CONNECTION_LOST") {
    error.message = "Erro de conexão com o banco de dados."
    error.status = 503
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

  if (err.code === "LIMIT_FILE_SIZE") {
    error.message = "Arquivo muito grande. Tamanho máximo permitido: 10MB"
    error.status = 413
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error.message = "Tipo de arquivo não permitido"
    error.status = 400
  }

  if (process.env.NODE_ENV === "production" && error.status === 500) {
    error.message = "Erro interno do servidor"
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === "development" && { code: err.code, stack: err.stack }),
  })
}

module.exports = errorHandler
