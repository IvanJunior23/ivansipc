const logService = require("../services/logService")

const logController = {
  async getAllLogs(req, res) {
    try {
      console.log(" getAllLogs chamado com query:", req.query)
      console.log(" Headers da requisição:", req.headers)

      const filters = {
        acao: req.query.acao,
        usuario_id: req.query.usuario_id,
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
        limit: req.query.limit || 100,
      }

      // Remove filtros vazios
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) delete filters[key]
      })

      console.log(" Filtros aplicados:", filters)

      const logs = await logService.getAllLogs(filters)

      console.log(" Logs encontrados:", logs.length)
      console.log(" Primeiro log (se existir):", logs[0])

      res.json({ success: true, data: logs })
    } catch (error) {
      console.error(" Erro ao buscar logs:", error)
      console.error(" Stack trace:", error.stack)
      res.status(500).json({ success: false, message: error.message, error: error.toString() })
    }
  },

  async getLogById(req, res) {
    try {
      const { id } = req.params
      const log = await logService.getLogById(id)
      res.json({ success: true, data: log })
    } catch (error) {
      console.error("Erro ao buscar log:", error)
      res.status(404).json({ success: false, message: error.message })
    }
  },

  async getLoginLogs(req, res) {
    try {
      const filters = {
        usuario_id: req.query.usuario_id,
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
        limit: req.query.limit || 100,
      }

      // Remove filtros vazios
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) delete filters[key]
      })

      const logs = await logService.getLoginLogs(filters)
      res.json({ success: true, data: logs })
    } catch (error) {
      console.error("Erro ao buscar logs de login:", error)
      res.status(500).json({ success: false, message: error.message })
    }
  },

  async getLoginStats(req, res) {
    try {
      console.log(" getLoginStats chamado com query:", req.query)

      const filters = {
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
      }

      // Remove filtros vazios
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) delete filters[key]
      })

      console.log(" Filtros de stats aplicados:", filters)

      const stats = await logService.getLoginStats(filters)

      console.log(" Stats encontradas:", stats)

      res.json({ success: true, data: stats })
    } catch (error) {
      console.error("Erro ao buscar estatísticas de login:", error)
      console.error(" Stack trace:", error.stack)
      res.status(500).json({ success: false, message: error.message })
    }
  },
}

module.exports = logController
