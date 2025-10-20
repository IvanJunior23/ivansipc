const { pool } = require("../../config/database")

const logModel = {
  async create(logData) {
    try {
      const query = `
            INSERT INTO log_sistema 
            (usuario_id, acao, detalhes, tabela_afetada, registro_id, valores_anteriores, valores_novos, ip_origem)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `

      const values = [
        logData.usuario_id,
        logData.acao,
        logData.detalhes,
        logData.tabela_afetada || null,
        logData.registro_id || null,
        logData.valores_anteriores ? JSON.stringify(logData.valores_anteriores) : null,
        logData.valores_novos ? JSON.stringify(logData.valores_novos) : null,
        logData.ip_origem || null,
      ]

      const [result] = await pool.execute(query, values)
      return result.insertId
    } catch (error) {
      console.error("Erro ao criar log:", error)
      throw error
    }
  },

  async findAll(filters = {}) {
    try {
      console.log(" logModel.findAll chamado com filtros:", filters)

      let query = `
        SELECT
          l.log_id,
          l.usuario_id,
          l.acao,
          l.detalhes,
          l.data_hora,
          l.tabela_afetada,
          l.registro_id,
          l.ip_origem,
          l.valores_anteriores,
          l.valores_novos
        FROM log_sistema l
        WHERE 1=1`

      const values = []

      if (filters.acao) {
        query += " AND l.acao = ?"
        values.push(filters.acao)
      }

      if (filters.usuario_id) {
        query += " AND l.usuario_id = ?"
        values.push(filters.usuario_id)
      }

      if (filters.data_inicio) {
        query += " AND l.data_hora >= ?"
        values.push(filters.data_inicio)
      }

      if (filters.data_fim) {
        query += " AND l.data_hora <= ?"
        values.push(filters.data_fim)
      }

      query += " ORDER BY l.data_hora DESC"

      const limitValue = filters.limit ? Number.parseInt(filters.limit, 10) : 100
      if (limitValue && limitValue > 0 && limitValue <= 1000) {
        query += ` LIMIT ${limitValue}`
      } else {
        query += " LIMIT 100"
      }

      console.log(" Query SQL FINAL:", query)
      console.log(" Valores FINAIS:", values)

      const [rows] = await pool.execute(query, values)
      console.log(" Resultado da query:", rows.length, "registros encontrados")

      const logsWithUserNames = await Promise.all(
        rows.map(async (log) => {
          try {
            const userQuery =
              "SELECT p.nome FROM usuario u JOIN pessoa p ON u.pessoa_id = p.pessoa_id WHERE u.usuario_id = ?"
            const [userRows] = await pool.execute(userQuery, [log.usuario_id])
            return {
              ...log,
              usuario_nome: userRows.length > 0 ? userRows[0].nome : `Usuário ${log.usuario_id}`,
            }
          } catch (userError) {
            console.error(" Erro ao buscar nome do usuário:", userError)
            return {
              ...log,
              usuario_nome: `Usuário ${log.usuario_id}`,
            }
          }
        }),
      )

      console.log(" Logs com nomes dos usuários:", logsWithUserNames.length)
      return logsWithUserNames
    } catch (error) {
      console.error(" Erro na query SQL (logModel.findAll):", error)
      console.error(" Stack trace completo:", error.stack)
      throw error
    }
  },

  async findById(logId) {
    try {
      const query = `
            SELECT l.*
            FROM log_sistema l
            WHERE l.log_id = ?
        `

      const [rows] = await pool.execute(query, [logId])

      if (rows.length === 0) {
        return null
      }

      const log = rows[0]

      try {
        const userQuery =
          "SELECT p.nome FROM usuario u JOIN pessoa p ON u.pessoa_id = p.pessoa_id WHERE u.usuario_id = ?"
        const [userRows] = await pool.execute(userQuery, [log.usuario_id])
        log.usuario_nome = userRows.length > 0 ? userRows[0].nome : `Usuário ${log.usuario_id}`
      } catch (userError) {
        console.error("Erro ao buscar nome do usuário:", userError)
        log.usuario_nome = `Usuário ${log.usuario_id}`
      }

      return log
    } catch (error) {
      console.error("Erro ao buscar log por ID:", error)
      throw error
    }
  },

  async getLoginStats(filters = {}) {
    try {
      console.log(" getLoginStats chamado com filtros:", filters)

      let query = `
            SELECT 
                DATE(data_hora) as data,
                COUNT(*) as total_logins,
                COUNT(DISTINCT usuario_id) as usuarios_unicos
            FROM log_sistema 
            WHERE acao = 'LOGIN'
        `

      const values = []

      if (filters.data_inicio) {
        query += " AND DATE(data_hora) >= ?"
        values.push(filters.data_inicio)
      }

      if (filters.data_fim) {
        query += " AND DATE(data_hora) <= ?"
        values.push(filters.data_fim)
      }

      query += " GROUP BY DATE(data_hora) ORDER BY data DESC"

      console.log(" Query de stats:", query)
      console.log(" Valores de stats:", values)

      const [rows] = await pool.execute(query, values)

      console.log(" Resultado das stats:", rows)

      return rows
    } catch (error) {
      console.error("Erro ao buscar estatísticas de login:", error)
      throw error
    }
  },
}

module.exports = logModel
