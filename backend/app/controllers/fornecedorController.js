const FornecedorService = require("../services/fornecedorService")

class FornecedorController {
  static async criar(req, res) {
    try {
      const fornecedor = await FornecedorService.criarFornecedor(req.body)
      res.status(201).json({
        success: true,
        message: "Fornecedor criado com sucesso",
        data: fornecedor,
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
      const fornecedor = await FornecedorService.buscarFornecedorPorId(req.params.id)
      res.json({
        success: true,
        data: fornecedor,
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
      const fornecedores = await FornecedorService.listarFornecedores(incluirInativos)
      res.json({
        success: true,
        data: fornecedores,
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
      const fornecedor = await FornecedorService.atualizarFornecedor(req.params.id, req.body)
      res.json({
        success: true,
        message: "Fornecedor atualizado com sucesso",
        data: fornecedor,
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
      const resultado = await FornecedorService.inativarFornecedor(req.params.id)
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

module.exports = FornecedorController
