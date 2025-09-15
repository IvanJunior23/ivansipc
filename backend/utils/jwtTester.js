const jwt = require("jsonwebtoken")
const { getJWTConfig } = require("../config/jwt")

class JWTTester {
  constructor() {
    this.testResults = []
  }

  runAllTests() {
    console.log("🧪 Starting comprehensive JWT tests...")

    this.testResults = []

    // Test 1: Token Generation
    this.testTokenGeneration()

    // Test 2: Token Structure Validation
    this.testTokenStructure()

    // Test 3: Token Encoding/Decoding
    this.testTokenEncoding()

    // Test 4: Token Verification
    this.testTokenVerification()

    // Test 5: Malformed Token Detection
    this.testMalformedTokens()

    // Test 6: Edge Cases
    this.testEdgeCases()

    return this.generateTestReport()
  }

  testTokenGeneration() {
    try {
      const config = getJWTConfig()
      const payload = { id: 1, tipo_usuario: "admin", nome: "Test User" }

      const token = jwt.sign(payload, config.secret, { expiresIn: config.expiresIn })

      this.addTestResult("Token Generation", true, "Token generated successfully", {
        tokenLength: token.length,
        tokenParts: token.split(".").length,
      })

      return token
    } catch (error) {
      this.addTestResult("Token Generation", false, error.message, { error: error.stack })
      return null
    }
  }

  testTokenStructure() {
    const testToken = this.testTokenGeneration()
    if (!testToken) return

    try {
      const parts = testToken.split(".")

      if (parts.length !== 3) {
        throw new Error(`Expected 3 parts, got ${parts.length}`)
      }

      // Test each part is valid base64url
      parts.forEach((part, index) => {
        if (!part || part.trim() !== part) {
          throw new Error(`Part ${index} has whitespace or is empty`)
        }

        try {
          Buffer.from(part, "base64url")
        } catch (e) {
          throw new Error(`Part ${index} is not valid base64url: ${e.message}`)
        }
      })

      this.addTestResult("Token Structure", true, "Token structure is valid", {
        parts: parts.length,
        partsLengths: parts.map((p) => p.length),
      })
    } catch (error) {
      this.addTestResult("Token Structure", false, error.message, { testToken })
    }
  }

  testTokenEncoding() {
    try {
      const testData = { test: "data", special: "chars!@#$%^&*()" }
      const encoded = Buffer.from(JSON.stringify(testData)).toString("base64url")
      const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString())

      if (JSON.stringify(testData) !== JSON.stringify(decoded)) {
        throw new Error("Encoding/decoding mismatch")
      }

      this.addTestResult("Token Encoding", true, "Encoding/decoding works correctly", {
        originalLength: JSON.stringify(testData).length,
        encodedLength: encoded.length,
      })
    } catch (error) {
      this.addTestResult("Token Encoding", false, error.message, { error: error.stack })
    }
  }

  testTokenVerification() {
    const testToken = this.testTokenGeneration()
    if (!testToken) return

    try {
      const config = getJWTConfig()
      const decoded = jwt.verify(testToken, config.secret)

      if (!decoded.id || !decoded.tipo_usuario) {
        throw new Error("Missing required payload fields")
      }

      this.addTestResult("Token Verification", true, "Token verification successful", {
        decodedFields: Object.keys(decoded),
        userId: decoded.id,
        userType: decoded.tipo_usuario,
      })
    } catch (error) {
      this.addTestResult("Token Verification", false, error.message, {
        errorName: error.name,
        testToken: testToken?.substring(0, 50) + "...",
      })
    }
  }

  testMalformedTokens() {
    const config = getJWTConfig()
    const malformedTokens = [
      "", // Empty token
      "invalid", // Single part
      "invalid.token", // Two parts
      "invalid.token.signature.extra", // Four parts
      "invalid token with spaces", // Spaces
      "invalid\ntoken\nwith\nnewlines", // Newlines
      "ínválid.tøken.wíth.spëcial", // Special characters
      null, // Null
      undefined, // Undefined
      123, // Number
      {}, // Object
    ]

    let detectedCount = 0
    const results = []

    malformedTokens.forEach((token, index) => {
      try {
        jwt.verify(token, config.secret)
        results.push({ index, token: String(token).substring(0, 20), detected: false })
      } catch (error) {
        detectedCount++
        results.push({
          index,
          token: String(token).substring(0, 20),
          detected: true,
          error: error.name,
        })
      }
    })

    const success = detectedCount === malformedTokens.length
    this.addTestResult(
      "Malformed Token Detection",
      success,
      `Detected ${detectedCount}/${malformedTokens.length} malformed tokens`,
      { results },
    )
  }

  testEdgeCases() {
    try {
      const config = getJWTConfig()

      // Test very long payload
      const longPayload = {
        id: 1,
        tipo_usuario: "admin",
        longString: "a".repeat(1000),
        largeObject: Array(100)
          .fill()
          .map((_, i) => ({ key: i, value: `value_${i}` })),
      }

      const longToken = jwt.sign(longPayload, config.secret, { expiresIn: "1h" })
      const decodedLong = jwt.verify(longToken, config.secret)

      // Test expired token
      const expiredToken = jwt.sign({ id: 1 }, config.secret, { expiresIn: "0s" })

      // Wait a moment to ensure expiration
      setTimeout(() => {
        try {
          jwt.verify(expiredToken, config.secret)
          this.addTestResult("Edge Cases", false, "Expired token was not rejected")
        } catch (error) {
          if (error.name === "TokenExpiredError") {
            this.addTestResult("Edge Cases", true, "All edge cases handled correctly", {
              longTokenLength: longToken.length,
              expiredTokenRejected: true,
            })
          } else {
            this.addTestResult("Edge Cases", false, `Unexpected error: ${error.message}`)
          }
        }
      }, 100)
    } catch (error) {
      this.addTestResult("Edge Cases", false, error.message, { error: error.stack })
    }
  }

  addTestResult(testName, success, message, data = {}) {
    const result = {
      testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString(),
    }

    this.testResults.push(result)

    const status = success ? "✅" : "❌"
    console.log(`${status} ${testName}: ${message}`)

    if (!success || process.env.NODE_ENV === "development") {
      console.log("   Data:", data)
    }
  }

  generateTestReport() {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter((r) => r.success).length
    const failedTests = totalTests - passedTests

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) + "%" : "0%",
      },
      results: this.testResults,
      recommendations: this.generateRecommendations(),
    }

    console.log("\n📊 JWT Test Report:")
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   Passed: ${passedTests}`)
    console.log(`   Failed: ${failedTests}`)
    console.log(`   Success Rate: ${report.summary.successRate}`)

    if (failedTests > 0) {
      console.log("\n❌ Failed Tests:")
      this.testResults
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`   - ${result.testName}: ${result.message}`)
        })
    }

    return report
  }

  generateRecommendations() {
    const recommendations = []
    const failedTests = this.testResults.filter((r) => !r.success)

    if (failedTests.some((t) => t.testName === "Token Generation")) {
      recommendations.push("Check JWT secret configuration and ensure it meets security requirements")
    }

    if (failedTests.some((t) => t.testName === "Token Structure")) {
      recommendations.push("Verify base64url encoding implementation and token format")
    }

    if (failedTests.some((t) => t.testName === "Token Verification")) {
      recommendations.push("Ensure JWT secret consistency between generation and verification")
    }

    if (failedTests.some((t) => t.testName === "Malformed Token Detection")) {
      recommendations.push("Improve input validation and error handling for malformed tokens")
    }

    if (recommendations.length === 0) {
      recommendations.push("All tests passed! JWT implementation appears to be working correctly.")
    }

    return recommendations
  }
}

module.exports = new JWTTester()
