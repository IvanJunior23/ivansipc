const mysql = require("mysql2/promise")
require("dotenv").config()

// Configuração do pool de conexões MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || localhost,
  user: process.env.DB_USER || root,
  password: process.env.DB_PASSWORD || ivan12345,
  database: process.env.DB_NAME || sipc_db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Função para testar conexão
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Conexão com MySQL estabelecida com sucesso!")
    connection.release()
    return true
  } catch (error) {
    console.error("❌ Erro ao conectar com MySQL:", error.message)
    return false
  }
}

module.exports = { pool, testConnection, db: pool }
