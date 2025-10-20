const logModel = require("../models/logModel")

const logService = {
  async createLog(logData) {
    try {
      const logId = await logModel.create(logData)
      return { logId, message: "Log criado com sucesso" }
    } catch (error) {
      console.error("Erro ao criar log:", error)
      throw new Error("Erro interno do servidor")
    }
  },

  async getAllLogs(filters = {}) {
    try {
      console.log(" logService.getAllLogs chamado com filtros:", filters)
      const logs = await logModel.findAll(filters)
      console.log(" logService.getAllLogs retornou", logs.length, "logs")
      return logs
    } catch (error) {
      console.error(" Erro no logService.getAllLogs:", error)
      console.error(" Stack trace:", error.stack)
      throw new Error("Erro interno do servidor")
    }
  },

  async getLogById(logId) {
    try {
      const log = await logModel.findById(logId)
      if (!log) {
        throw new Error("Log não encontrado")
      }
      return log
    } catch (error) {
      console.error("Erro ao buscar log:", error)
      throw error
    }
  },

  async getLoginLogs(filters = {}) {
    try {
      const loginFilters = { ...filters, acao: "LOGIN" }
      const logs = await logModel.findAll(loginFilters)
      return logs
    } catch (error) {
      console.error("Erro ao buscar logs de login:", error)
      throw new Error("Erro interno do servidor")
    }
  },

  async getLoginStats(filters = {}) {
    try {
      const stats = await logModel.getLoginStats(filters)
      return stats
    } catch (error) {
      console.error("Erro ao buscar estatísticas de login:", error)
      throw new Error("Erro interno do servidor")
    }
  },

  // Métodos de conveniência para registrar logs específicos
  async logLogin(userId, ipAddress, detalhes = "Usuário fez login no sistema") {
    return await this.createLog({
      usuario_id: userId,
      acao: "LOGIN",
      detalhes,
      ip_origem: ipAddress,
    })
  },

  async logLogout(userId, ipAddress, detalhes = "Usuário fez logout do sistema") {
    return await this.createLog({
      usuario_id: userId,
      acao: "LOGOUT",
      detalhes,
      ip_origem: ipAddress,
    })
  },
}

module.exports = logService
