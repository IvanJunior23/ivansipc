const ClienteService = require("../services/clienteService")

class ClienteController {
  static async criar(req, res) {
    try {
      const cliente = await ClienteService.criarCliente(req.body)
      res.status(201).json({
        success: true,
        message: "Cliente criado com sucesso",
        data: cliente,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async buscarPorId(req, res) {
    try {
      const cliente = await ClienteService.buscarClientePorId(req.params.id)
      res.json({
        success: true,
        data: cliente,
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async listar(req, res) {
    try {
      const incluirInativos = req.query.incluir_inativos === "true"
      console.log(" Controller: incluirInativos =", incluirInativos)

      const clientes = await ClienteService.listarClientes(incluirInativos)

      console.log(" Controller: Total de clientes retornados =", clientes.length)
      console.log(" Controller: Clientes por status:", {
        ativos: clientes.filter((c) => c.status).length,
        inativos: clientes.filter((c) => !c.status).length,
      })

      res.json({
        success: true,
        data: clientes,
      })
    } catch (error) {
      console.error(" Controller: Erro ao listar clientes:", error)
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async atualizar(req, res) {
    try {
      const cliente = await ClienteService.atualizarCliente(req.params.id, req.body)
      res.json({
        success: true,
        message: "Cliente atualizado com sucesso",
        data: cliente,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async inativar(req, res) {
    try {
      const resultado = await ClienteService.inativarCliente(req.params.id)
      res.json({
        success: true,
        message: resultado.message,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async toggleStatus(req, res) {
    try {
      const { id } = req.params
      const { status } = req.body

      console.log("🔄 Controller: alterando status do cliente ID:", id, "para:", status)

      // Validar se o parâmetro status foi fornecido
      if (status === undefined || status === null) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "status" é obrigatório',
        })
      }

      // Validar se é um valor boolean válido
      if (typeof status !== "boolean" && status !== 0 && status !== 1 && status !== "0" && status !== "1") {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "status" deve ser boolean, 0 ou 1',
        })
      }

      const clienteAtualizado = await ClienteService.updateClienteStatus(id, status)
      res.json({ success: true, data: clienteAtualizado })
    } catch (error) {
      console.error("❌ Controller: erro ao alterar status:", error)
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno do servidor",
      })
    }
  }
}

module.exports = ClienteController
