const UsuarioModel = require("../models/usuarioModel")
const PessoaService = require("./pessoaService")
const bcrypt = require("bcryptjs")
const { pool } = require("../../config/database")

class UsuarioService {
  static async criarUsuario(dadosUsuario) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const { email, senha, tipo_usuario, nome, telefone, endereco } = dadosUsuario

      // Verificar se email já existe
      const emailExistente = await UsuarioModel.buscarPorEmail(email)
      if (emailExistente) {
        throw new Error("Este email já está cadastrado")
      }

      // Criar pessoa completa (com contato e endereço)
      const dadosPessoa = {
        nome,
        contato:
          telefone || email
            ? {
                nome_completo: nome,
                telefone: telefone || null,
                email: email,
              }
            : null,
        endereco: endereco || null,
      }

      const pessoaId = await PessoaService.criarPessoaCompleta(dadosPessoa)

      // Hash da senha
      const senhaHash = await bcrypt.hash(senha, 10)

      // Criar usuário vinculado à pessoa
      const usuarioId = await UsuarioModel.criar({
        pessoa_id: pessoaId,
        email,
        senha: senhaHash,
        tipo_usuario,
      })

      await connection.commit()
      return await UsuarioModel.buscarPorId(usuarioId)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async buscarUsuarioPorId(id) {
    const usuario = await UsuarioModel.buscarPorId(id)
    if (!usuario) {
      throw new Error("Usuário não encontrado")
    }
    // Remover senha do retorno
    delete usuario.senha
    return usuario
  }

  static async listarUsuarios(incluirInativos = false) {
    const usuarios = await UsuarioModel.buscarTodos(true)
    // Remover senhas do retorno
    return usuarios.map((u) => {
      delete u.senha
      return u
    })
  }

  static async atualizarUsuario(id, dadosUsuario) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const usuarioExistente = await UsuarioModel.buscarPorId(id)
      if (!usuarioExistente) {
        throw new Error("Usuário não encontrado")
      }

      const { email, senha, tipo_usuario, nome, telefone, endereco } = dadosUsuario

      // Verificar se outro usuário já usa este email
      if (email && email !== usuarioExistente.email) {
        const usuarioComMesmoEmail = await UsuarioModel.buscarPorEmail(email)
        if (usuarioComMesmoEmail && usuarioComMesmoEmail.usuario_id !== Number.parseInt(id)) {
          throw new Error("Usuário com este email já existe")
        }
      }

      // Atualizar pessoa completa (com contato e endereço)
      if (nome || telefone || email || endereco) {
        const dadosPessoa = {
          nome: nome || usuarioExistente.nome,
          contato:
            telefone || email
              ? {
                  nome_completo: nome || usuarioExistente.nome,
                  telefone: telefone || null,
                  email: email || usuarioExistente.email,
                }
              : null,
          endereco: endereco || null,
        }

        await PessoaService.atualizarPessoaCompleta(usuarioExistente.pessoa_id, dadosPessoa)
      }

      // Atualizar usuário
      const dadosAtualizacao = {
        email: email || usuarioExistente.email,
        tipo_usuario: tipo_usuario || usuarioExistente.tipo_usuario,
      }

      // Se senha foi fornecida, fazer hash
      if (senha) {
        dadosAtualizacao.senha = await bcrypt.hash(senha, 10)
      }

      const sucesso = await UsuarioModel.atualizar(id, dadosAtualizacao)
      if (!sucesso) {
        throw new Error("Erro ao atualizar usuário")
      }

      await connection.commit()
      const usuarioAtualizado = await UsuarioModel.buscarPorId(id)
      delete usuarioAtualizado.senha
      return usuarioAtualizado
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async inativarUsuario(id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const usuario = await UsuarioModel.buscarPorId(id)
      if (!usuario) {
        throw new Error("Usuário não encontrado")
      }

      const sucesso = await UsuarioModel.inativar(id)
      if (!sucesso) {
        throw new Error("Erro ao inativar usuário")
      }

      await connection.commit()
      return { message: "Usuário inativado com sucesso" }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async updateUsuarioStatus(id, status) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const usuario = await UsuarioModel.buscarPorId(id)
      if (!usuario) {
        throw new Error("Usuário não encontrado")
      }

      const sucesso = await UsuarioModel.toggleStatus(id, status)
      if (!sucesso) {
        throw new Error("Erro ao alterar status do usuário")
      }

      await connection.commit()
      const usuarioAtualizado = await UsuarioModel.buscarPorId(id)
      delete usuarioAtualizado.senha
      return usuarioAtualizado
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

module.exports = UsuarioService
