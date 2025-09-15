const PecaService = require("../services/pecaService")

class PecaController {
  static async criar(req, res) {
    try {
      const { imagens, ...dadosPeca } = req.body
      const peca = await PecaService.criarPeca(dadosPeca, imagens)
      res.status(201).json({
        success: true,
        message: "Peça criada com sucesso",
        data: peca,
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
      const peca = await PecaService.buscarPecaPorId(req.params.id)
      res.json({
        success: true,
        data: peca,
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
      const filtros = {
        categoria_id: req.query.categoria_id,
        marca_id: req.query.marca_id,
        condicao: req.query.condicao,
        estoque_baixo: req.query.estoque_baixo === "true",
      }

      const pecas = await PecaService.listarPecas(incluirInativos, filtros)
      res.json({
        success: true,
        data: pecas,
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
      const peca = await PecaService.atualizarPeca(req.params.id, req.body)
      res.json({
        success: true,
        message: "Peça atualizada com sucesso",
        data: peca,
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
      const resultado = await PecaService.inativarPeca(req.params.id)
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

  static async adicionarImagem(req, res) {
    try {
      const { imagem_url, descricao } = req.body
      const imagem = await PecaService.adicionarImagemPeca(req.params.id, imagem_url, descricao)
      res.status(201).json({
        success: true,
        message: "Imagem adicionada com sucesso",
        data: imagem,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      })
    }
  }

  static async removerImagem(req, res) {
    try {
      const resultado = await PecaService.removerImagemPeca(req.params.id, req.params.imagemId)
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

  static async buscarImagens(req, res) {
    try {
      const imagens = await PecaService.buscarImagensPeca(req.params.id)
      res.json({
        success: true,
        data: imagens,
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      })
    }
  }
}

module.exports = PecaController
