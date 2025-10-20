const FornecedorService = require("../services/fornecedorService")

class FornecedorController {
  static async criar(req, res) {
    try {
      console.log(" 📝 Controller: criando fornecedor com dados:", req.body)
      const fornecedor = await FornecedorService.criarFornecedor(req.body)
      res.status(201).json({
        success: true,
        message: "Fornecedor criado com sucesso",
        data: fornecedor,
      })
    } catch (error) {
      console.error(" ❌ Controller: erro ao criar fornecedor:", error)
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async buscarPorId(req, res) {
    try {
      console.log("🔍 Controller: buscando fornecedor ID:", req.params.id)
      const fornecedor = await FornecedorService.buscarFornecedorPorId(req.params.id)
      res.json({
        success: true,
        data: fornecedor,
      })
    } catch (error) {
      console.error(" ❌ Controller: erro ao buscar fornecedor:", error)
      res.status(404).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async listar(req, res) {
    try {
      console.log(" 📋 Controller: listando fornecedores")
      const incluirInativos = req.query.incluir_inativos === "true"
      const fornecedores = await FornecedorService.listarFornecedores(incluirInativos)
      console.log("✅ Controller: retornando", fornecedores.length, "fornecedores")
      res.json({
        success: true,
        data: fornecedores,
      })
    } catch (error) {
      console.error(" ❌ Controller: erro ao listar fornecedores:", error)
      res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async atualizar(req, res) {
    try {
      console.log(" 📝 Controller: atualizando fornecedor ID:", req.params.id)
      const fornecedor = await FornecedorService.atualizarFornecedor(req.params.id, req.body)
      res.json({
        success: true,
        message: "Fornecedor atualizado com sucesso",
        data: fornecedor,
      })
    } catch (error) {
      console.error(" ❌ Controller: erro ao atualizar fornecedor:", error)
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async inativar(req, res) {
    try {
      console.log(" 🗑️ Controller: inativando fornecedor ID:", req.params.id)
      const resultado = await FornecedorService.inativarFornecedor(req.params.id)
      res.json({
        success: true,
        message: resultado.message,
      })
    } catch (error) {
      console.error(" ❌ Controller: erro ao inativar fornecedor:", error)
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

      console.log("🔄 Controller: alterando status do fornecedor ID:", id, "para:", status)

      if (status === undefined || status === null) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "status" é obrigatório',
        })
      }

      if (typeof status !== "boolean" && status !== 0 && status !== 1 && status !== "0" && status !== "1") {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "status" deve ser boolean, 0 ou 1',
        })
      }

      const fornecedorAtualizado = await FornecedorService.updateFornecedorStatus(id, status)
      console.log(" ✅ Controller: status alterado com sucesso")
      res.json({ success: true, data: fornecedorAtualizado })
    } catch (error) {
      console.error(" ❌ Controller: erro ao alterar status:", error)
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno do servidor",
      })
    }
  }
}

module.exports = FornecedorController
