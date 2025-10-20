const { db } = require("../config/database") // Fixed database import

const auditHelper = {
  async logAction(
    action,
    userId,
    details,
    tableAffected = null,
    recordId = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
  ) {
    try {
      const query = `
                INSERT INTO log_sistema 
                (usuario_id, acao, detalhes, tabela_afetada, registro_id, valores_anteriores, valores_novos, ip_origem)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `

      const values = [
        userId,
        action,
        details,
        tableAffected,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
      ]

      await db.execute(query, values) // Fixed from pool to db
    } catch (error) {
      console.error("Erro ao registrar log:", error)
    }
  },

  async logLogin(userId, ipAddress) {
    await this.logAction("LOGIN", userId, "Usuário fez login no sistema", null, null, null, null, ipAddress)
  },

  async logLogout(userId, ipAddress) {
    await this.logAction("LOGOUT", userId, "Usuário fez logout do sistema", null, null, null, null, ipAddress)
  },
}

module.exports = auditHelper
