const ClienteModel = require("../models/clienteModel")
const PessoaModel = require("../models/pessoaModel")
const ContatoModel = require("../models/contatoModel")
const EnderecoModel = require("../models/enderecoModel")
const PessoaService = require("./pessoaService")
const { db } = require("../../config/database")

class ClienteService {
  static async criarCliente(dadosCliente) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const { cpf, nome, telefone, email, endereco } = dadosCliente

      // Validar CPF único
      const cpfExistente = await ClienteModel.buscarPorCpf(cpf)
      if (cpfExistente) {
        throw new Error("Este CPF já está cadastrado")
      }

      // Criar pessoa completa (com contato e endereço)
      const dadosPessoa = {
        nome,
        contato:
          telefone || email
            ? {
                nome_completo: nome,
                telefone: telefone || null,
                email: email || null,
              }
            : null,
        endereco: endereco || null,
      }

      const pessoaId = await PessoaService.criarPessoaCompleta(dadosPessoa)

      // Criar cliente vinculado à pessoa
      const clienteId = await ClienteModel.criar({
        pessoa_id: pessoaId,
        cpf,
      })

      await connection.commit()
      return await ClienteModel.buscarPorId(clienteId)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async buscarClientePorId(id) {
    const cliente = await ClienteModel.buscarPorId(id)
    if (!cliente) {
      throw new Error("Cliente não encontrado")
    }
    return cliente
  }

  static async listarClientes(incluirInativos = true) {
    return await ClienteModel.buscarTodos(incluirInativos)
  }

  static async atualizarCliente(id, dadosCliente) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const clienteExistente = await ClienteModel.buscarPorId(id)
      if (!clienteExistente) {
        throw new Error("Cliente não encontrado")
      }

      const { cpf, nome, telefone, email, endereco } = dadosCliente

      // Verificar se outro cliente já usa este CPF
      if (cpf && cpf !== clienteExistente.cpf) {
        const clienteComMesmoCpf = await ClienteModel.buscarPorCpf(cpf)
        if (clienteComMesmoCpf && clienteComMesmoCpf.cliente_id !== Number.parseInt(id)) {
          throw new Error("Cliente com este CPF já existe")
        }
      }

      // Atualizar pessoa completa (com contato e endereço)
      if (nome || telefone || email || endereco) {
        const dadosPessoa = {
          nome: nome || clienteExistente.nome,
          contato:
            telefone || email
              ? {
                  nome_completo: nome || clienteExistente.nome,
                  telefone: telefone || null,
                  email: email || null,
                }
              : null,
          endereco: endereco || null,
        }

        await PessoaService.atualizarPessoaCompleta(clienteExistente.pessoa_id, dadosPessoa)
      }

      // Atualizar cliente
      if (cpf) {
        const sucesso = await ClienteModel.atualizar(id, {
          cpf,
          status: dadosCliente.status !== undefined ? dadosCliente.status : clienteExistente.status,
        })

        if (!sucesso) {
          throw new Error("Erro ao atualizar cliente")
        }
      }

      await connection.commit()
      return await ClienteModel.buscarPorId(id)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async inativarCliente(id) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const cliente = await ClienteModel.buscarPorId(id)
      if (!cliente) {
        throw new Error("Cliente não encontrado")
      }

      const sucesso = await ClienteModel.inativar(id)
      if (!sucesso) {
        throw new Error("Erro ao inativar cliente")
      }

      await connection.commit()
      return { message: "Cliente inativado com sucesso" }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async ativarCliente(id) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const cliente = await ClienteModel.buscarPorId(id)
      if (!cliente) {
        throw new Error("Cliente não encontrado")
      }

      const sucesso = await ClienteModel.ativar(id)
      if (!sucesso) {
        throw new Error("Erro ao ativar cliente")
      }

      await connection.commit()
      return { message: "Cliente ativado com sucesso" }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async updateClienteStatus(id, status) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const cliente = await ClienteModel.buscarPorId(id)
      if (!cliente) {
        throw new Error("Cliente não encontrado")
      }

      const sucesso = await ClienteModel.toggleStatus(id, status)
      if (!sucesso) {
        throw new Error("Erro ao alterar status do cliente")
      }

      await connection.commit()
      return await ClienteModel.buscarPorId(id)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

module.exports = ClienteService
