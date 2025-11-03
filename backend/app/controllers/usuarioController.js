const UsuarioService = require("../services/usuarioService")

class UsuarioController {
  static async criar(req, res) {
    try {
      const usuario = await UsuarioService.criarUsuario(req.body)
      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        data: usuario,
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
      const usuario = await UsuarioService.buscarUsuarioPorId(req.params.id)
      res.json({
        success: true,
        data: usuario,
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
      const usuarios = await UsuarioService.listarUsuarios(incluirInativos)
      res.json({
        success: true,
        data: usuarios,
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
      const usuario = await UsuarioService.atualizarUsuario(req.params.id, req.body)
      res.json({
        success: true,
        message: "Usuário atualizado com sucesso",
        data: usuario,
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
      const resultado = await UsuarioService.inativarUsuario(req.params.id)
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

      if (status === undefined || status === null) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetro "status" é obrigatório',
        })
      }

      const usuarioAtualizado = await UsuarioService.updateUsuarioStatus(id, status)
      res.json({ success: true, data: usuarioAtualizado })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message || "Erro interno do servidor",
      })
    }
  }
}

module.exports = UsuarioController
