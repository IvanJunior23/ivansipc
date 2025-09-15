const jwt = require("jsonwebtoken")
const { getJWTConfig } = require("../config/jwt")

class JWTDebugger {
  constructor() {
    this.logs = []
    this.enabled = process.env.NODE_ENV !== "production"
  }

  log(level, message, data = {}) {
    if (!this.enabled) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: new Error().stack,
    }

    this.logs.push(logEntry)
    console.log(`[JWT-DEBUG-${level.toUpperCase()}] ${message}`, data)

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift()
    }
  }

  debugTokenGeneration(payload, options = {}) {
    this.log("INFO", "Starting token generation", { payload, options })

    try {
      const config = getJWTConfig()
      this.log("INFO", "JWT config loaded", {
        secretLength: config.secret.length,
        expiresIn: config.expiresIn,
      })

      // Generate token
      const token = jwt.sign(payload, config.secret, {
        expiresIn: config.expiresIn,
        ...options,
      })

      this.log("SUCCESS", "Token generated successfully", {
        tokenLength: token.length,
        tokenParts: token.split(".").length,
        tokenPreview: token.substring(0, 50) + "...",
      })

      // Validate generated token immediately
      this.validateTokenStructure(token)

      return token
    } catch (error) {
      this.log("ERROR", "Token generation failed", {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  debugTokenVerification(token, secret) {
    this.log("INFO", "Starting token verification", {
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 50) + "..." : "null",
      secretLength: secret ? secret.length : 0,
    })

    try {
      // Check token structure first
      this.validateTokenStructure(token)

      // Attempt verification
      const decoded = jwt.verify(token, secret)

      this.log("SUCCESS", "Token verified successfully", {
        userId: decoded.id,
        userType: decoded.tipo_usuario,
        exp: decoded.exp,
        iat: decoded.iat,
      })

      return decoded
    } catch (error) {
      this.log("ERROR", "Token verification failed", {
        error: error.message,
        errorName: error.name,
        stack: error.stack,
      })
      throw error
    }
  }

  validateTokenStructure(token) {
    if (!token) {
      throw new Error("Token is null or undefined")
    }

    if (typeof token !== "string") {
      throw new Error(`Token must be a string, got ${typeof token}`)
    }

    const parts = token.split(".")
    if (parts.length !== 3) {
      this.log("ERROR", "Invalid token structure", {
        partsCount: parts.length,
        parts: parts.map((part, index) => ({
          index,
          length: part.length,
          preview: part.substring(0, 20) + "...",
        })),
      })
      throw new Error(`JWT must have 3 parts, got ${parts.length}`)
    }

    // Validate each part is base64url encoded
    parts.forEach((part, index) => {
      try {
        const decoded = Buffer.from(part, "base64url").toString()
        this.log("DEBUG", `Token part ${index} decoded successfully`, {
          partIndex: index,
          originalLength: part.length,
          decodedLength: decoded.length,
        })
      } catch (error) {
        this.log("ERROR", `Token part ${index} is not valid base64url`, {
          partIndex: index,
          part: part.substring(0, 50),
          error: error.message,
        })
        throw new Error(`Token part ${index} is not valid base64url encoded`)
      }
    })

    this.log("SUCCESS", "Token structure validation passed", {
      partsCount: parts.length,
      totalLength: token.length,
    })
  }

  getLogs(level = null) {
    if (level) {
      return this.logs.filter((log) => log.level === level.toUpperCase())
    }
    return this.logs
  }

  clearLogs() {
    this.logs = []
    this.log("INFO", "Debug logs cleared")
  }

  generateReport() {
    const report = {
      totalLogs: this.logs.length,
      errors: this.logs.filter((log) => log.level === "ERROR").length,
      warnings: this.logs.filter((log) => log.level === "WARN").length,
      successes: this.logs.filter((log) => log.level === "SUCCESS").length,
      recentErrors: this.logs
        .filter((log) => log.level === "ERROR")
        .slice(-5)
        .map((log) => ({
          timestamp: log.timestamp,
          message: log.message,
          data: log.data,
        })),
    }

    this.log("INFO", "Debug report generated", report)
    return report
  }
}

module.exports = new JWTDebugger()
