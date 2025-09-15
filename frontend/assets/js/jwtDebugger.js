class JWTDebugger {
  constructor() {
    this.logs = []
    this.enabled = true // Always enabled for debugging
    this.maxLogs = 50
  }

  log(level, message, data = {}) {
    if (!this.enabled) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data: JSON.parse(JSON.stringify(data)), // Deep clone to avoid reference issues
      url: window.location.pathname,
    }

    this.logs.push(logEntry)

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output with styling
    const style = this.getLogStyle(level)
    console.log(`%c[JWT-${level.toUpperCase()}] ${message}`, style, data)
  }

  getLogStyle(level) {
    const styles = {
      ERROR: "color: #ff4444; font-weight: bold;",
      WARN: "color: #ffaa00; font-weight: bold;",
      INFO: "color: #4444ff;",
      SUCCESS: "color: #44aa44; font-weight: bold;",
      DEBUG: "color: #888888;",
    }
    return styles[level.toUpperCase()] || styles.INFO
  }

  debugTokenStorage(token, action = "store") {
    this.log("DEBUG", `Token ${action} operation`, {
      action,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 30) + "..." : "null",
      localStorage: !!window.localStorage,
      storageAvailable: this.isStorageAvailable(),
    })

    if (token && action === "store") {
      const validation = this.validateTokenFormat(token)
      if (!validation.isValid) {
        this.log("ERROR", "Attempting to store invalid token", validation)
        return false
      }
    }

    return true
  }

  debugTokenRetrieval() {
    const token = localStorage.getItem("token")

    this.log("DEBUG", "Token retrieval attempt", {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 30) + "..." : "null",
    })

    if (token) {
      const validation = this.validateTokenFormat(token)
      if (!validation.isValid) {
        this.log("ERROR", "Retrieved token is invalid", validation)
        return null
      }

      this.log("SUCCESS", "Token retrieved successfully", {
        tokenLength: token.length,
        isValid: validation.isValid,
      })
    }

    return token
  }

  debugHttpRequest(url, method, token) {
    this.log("INFO", `HTTP request with token`, {
      url,
      method,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      authHeader: token ? `Bearer ${token.substring(0, 20)}...` : "none",
    })

    if (token) {
      const validation = this.validateTokenFormat(token)
      if (!validation.isValid) {
        this.log("ERROR", "HTTP request with invalid token", {
          url,
          method,
          validation,
        })
        return false
      }
    }

    return true
  }

  debugHttpResponse(response, url, method) {
    const isAuthError = response.status === 401 || response.status === 403

    this.log(isAuthError ? "ERROR" : "INFO", `HTTP response received`, {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      isAuthError,
      headers: {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      },
    })

    if (isAuthError) {
      this.log("WARN", "Authentication error detected", {
        url,
        method,
        status: response.status,
        possibleCauses: ["Token expired", "Token malformed", "Token missing", "Invalid credentials"],
      })
    }

    return response
  }

  validateTokenFormat(token) {
    const validation = {
      isValid: true,
      errors: [],
      details: {},
    }

    // Check if token exists
    if (!token) {
      validation.isValid = false
      validation.errors.push("Token is null or undefined")
      return validation
    }

    // Check if token is string
    if (typeof token !== "string") {
      validation.isValid = false
      validation.errors.push(`Token must be string, got ${typeof token}`)
      return validation
    }

    // Check for whitespace
    if (token !== token.trim()) {
      validation.isValid = false
      validation.errors.push("Token contains leading/trailing whitespace")
    }

    // Check JWT structure (3 parts separated by dots)
    const parts = token.split(".")
    validation.details.partsCount = parts.length

    if (parts.length !== 3) {
      validation.isValid = false
      validation.errors.push(`JWT must have 3 parts, got ${parts.length}`)
      return validation
    }

    // Validate each part
    parts.forEach((part, index) => {
      if (!part) {
        validation.isValid = false
        validation.errors.push(`Part ${index} is empty`)
        return
      }

      // Check for valid base64url characters
      const base64urlRegex = /^[A-Za-z0-9_-]+$/
      if (!base64urlRegex.test(part)) {
        validation.isValid = false
        validation.errors.push(`Part ${index} contains invalid characters`)
      }
    })

    // Try to decode header and payload
    try {
      const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")))
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

      validation.details.header = header
      validation.details.payload = {
        id: payload.id,
        tipo_usuario: payload.tipo_usuario,
        exp: payload.exp,
        iat: payload.iat,
      }

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        validation.isValid = false
        validation.errors.push("Token is expired")
      }
    } catch (error) {
      validation.isValid = false
      validation.errors.push(`Failed to decode token: ${error.message}`)
    }

    return validation
  }

  isStorageAvailable() {
    try {
      const test = "__storage_test__"
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  getLogs(level = null) {
    if (level) {
      return this.logs.filter((log) => log.level === level.toUpperCase())
    }
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
    this.log("INFO", "Debug logs cleared")
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      totalLogs: this.logs.length,
      logsByLevel: {},
      recentErrors: [],
      tokenStatus: null,
      recommendations: [],
    }

    // Count logs by level
    this.logs.forEach((log) => {
      report.logsByLevel[log.level] = (report.logsByLevel[log.level] || 0) + 1
    })

    // Get recent errors
    report.recentErrors = this.logs
      .filter((log) => log.level === "ERROR")
      .slice(-5)
      .map((log) => ({
        timestamp: log.timestamp,
        message: log.message,
        data: log.data,
      }))

    // Check current token status
    const currentToken = localStorage.getItem("token")
    if (currentToken) {
      report.tokenStatus = this.validateTokenFormat(currentToken)
    }

    // Generate recommendations
    if (report.recentErrors.length > 0) {
      report.recommendations.push("Recent authentication errors detected - check token validity")
    }

    if (report.tokenStatus && !report.tokenStatus.isValid) {
      report.recommendations.push("Current stored token is invalid - user should re-login")
    }

    if (report.logsByLevel.ERROR > 5) {
      report.recommendations.push("High error rate detected - investigate authentication flow")
    }

    this.log("INFO", "Debug report generated", report)
    return report
  }

  // Public methods for integration with auth.js
  static getInstance() {
    if (!window.jwtDebugger) {
      window.jwtDebugger = new JWTDebugger()
    }
    return window.jwtDebugger
  }
}

// Create global instance
window.jwtDebugger = JWTDebugger.getInstance()

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = JWTDebugger
}
