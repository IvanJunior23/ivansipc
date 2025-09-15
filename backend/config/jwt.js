const JWT_SECRET = process.env.JWT_SECRET || "sipc_secret_key_2024"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h"

// Validate JWT secret configuration
const validateJWTConfig = () => {
  if (!process.env.JWT_SECRET) {
    console.warn("⚠️  JWT_SECRET not set in environment variables, using fallback secret")
    console.warn("⚠️  For production, please set JWT_SECRET environment variable")
  }

  if (JWT_SECRET.length < 32) {
    console.warn("⚠️  JWT secret is shorter than recommended 32 characters")
  }

  console.log("✅ JWT Configuration loaded:", {
    secretLength: JWT_SECRET.length,
    expiresIn: JWT_EXPIRES_IN,
    usingEnvVar: !!process.env.JWT_SECRET,
  })
}

const getJWTConfig = () => {
  return {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN,
  }
}

// Initialize validation on module load
validateJWTConfig()

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  validateJWTConfig,
  getJWTConfig, // Added getJWTConfig to exports
}
