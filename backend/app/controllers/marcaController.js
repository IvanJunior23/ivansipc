const MarcaService = require("../services/marcaService")

class MarcaController {
  static async criar(req, res) {
    try {
      const marca = await MarcaService.criarMarca(req.body)
      res.status(201).json({
        success: true,
        message: "Marca criada com sucesso",
        data: marca,
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
      const marca = await MarcaService.buscarMarcaPorId(req.params.id)
      res.json({
        success: true,
        data: marca,
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
      const marcas = await MarcaService.listarMarcas(incluirInativos)
      res.json({
        success: true,
        data: marcas,
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
      const marca = await MarcaService.atualizarMarca(req.params.id, req.body)
      res.json({
        success: true,
        message: "Marca atualizada com sucesso",
        data: marca,
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
      const resultado = await MarcaService.inativarMarca(req.params.id)
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

module.exports = MarcaController
