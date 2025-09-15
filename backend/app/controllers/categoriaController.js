const CategoriaService = require("../services/categoriaService")

class CategoriaController {
  static async criar(req, res) {
    try {
      const categoria = await CategoriaService.criarCategoria(req.body)
      res.status(201).json({
        success: true,
        message: "Categoria criada com sucesso",
        data: categoria,
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
      const categoria = await CategoriaService.buscarCategoriaPorId(req.params.id)
      res.json({
        success: true,
        data: categoria,
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
      const categorias = await CategoriaService.listarCategorias(incluirInativos)
      res.json({
        success: true,
        data: categorias,
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
      const categoria = await CategoriaService.atualizarCategoria(req.params.id, req.body)
      res.json({
        success: true,
        message: "Categoria atualizada com sucesso",
        data: categoria,
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
      const resultado = await CategoriaService.inativarCategoria(req.params.id)
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

module.exports = CategoriaController
