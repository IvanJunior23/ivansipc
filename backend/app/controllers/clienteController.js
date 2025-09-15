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
      const clientes = await ClienteService.listarClientes(incluirInativos)
      res.json({
        success: true,
        data: clientes,
      })
    } catch (error) {
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
}

module.exports = ClienteController
