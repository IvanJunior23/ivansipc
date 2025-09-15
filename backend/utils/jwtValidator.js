const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../config/jwt")

const validateTokenStructure = (token) => {
  const errors = []

  if (!token) {
    errors.push("Token is null or undefined")
    return { isValid: false, errors }
  }

  if (typeof token !== "string") {
    errors.push(`Token must be string, got ${typeof token}`)
    return { isValid: false, errors }
  }

  // Check for whitespace
  if (token !== token.trim()) {
    errors.push("Token contains leading/trailing whitespace")
  }

  // Check JWT format (3 parts separated by dots)
  const parts = token.split(".")
  if (parts.length !== 3) {
    errors.push(`Token must have 3 parts, got ${parts.length}`)
    return { isValid: false, errors }
  }

  // Validate each part is valid base64url
  parts.forEach((part, index) => {
    if (!part) {
      errors.push(`Token part ${index} is empty`)
      return
    }

    // Check for invalid base64url characters
    if (!/^[A-Za-z0-9_-]+$/.test(part)) {
      errors.push(`Token part ${index} contains invalid characters`)
    }

    try {
      // Try to decode as base64url
      const decoded = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64")
      if (index < 2) {
        // Header and payload should be valid JSON
        JSON.parse(decoded.toString())
      }
    } catch (decodeError) {
      errors.push(`Token part ${index} is not valid base64url: ${decodeError.message}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    parts: parts.length === 3 ? parts : null,
  }
}

const testTokenVerification = (token) => {
  const structureTest = validateTokenStructure(token)

  if (!structureTest.isValid) {
    return {
      isValid: false,
      stage: "structure",
      errors: structureTest.errors,
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return {
      isValid: true,
      stage: "verification",
      decoded: {
        id: decoded.id,
        tipo_usuario: decoded.tipo_usuario,
        exp: new Date(decoded.exp * 1000).toISOString(),
        iat: new Date(decoded.iat * 1000).toISOString(),
      },
    }
  } catch (verifyError) {
    return {
      isValid: false,
      stage: "verification",
      errors: [verifyError.message],
      errorType: verifyError.name,
    }
  }
}

const logTokenAnalysis = (token, source = "unknown") => {
  console.log(`\n🔍 JWT Analysis from ${source}:`)
  console.log("=====================================")

  const analysis = testTokenVerification(token)

  console.log("Token Info:", {
    length: token?.length || 0,
    preview: token ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : "null",
    hasWhitespace: token ? token !== token.trim() : false,
  })

  if (analysis.isValid) {
    console.log("✅ Token is VALID")
    console.log("Decoded payload:", analysis.decoded)
  } else {
    console.log(`❌ Token is INVALID at ${analysis.stage} stage`)
    console.log("Errors:", analysis.errors)
    if (analysis.errorType) {
      console.log("Error type:", analysis.errorType)
    }
  }

  console.log("=====================================\n")

  return analysis
}

module.exports = {
  validateTokenStructure,
  testTokenVerification,
  logTokenAnalysis,
}
