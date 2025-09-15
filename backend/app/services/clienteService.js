const ClienteModel = require("../models/clienteModel")
const PessoaModel = require("../models/pessoaModel")
const ContatoModel = require("../models/contatoModel")
const EnderecoModel = require("../models/enderecoModel")
const db = require("../../config/database")

class ClienteService {
  static async criarCliente(dadosCliente) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const { nome, cpf, contato, endereco } = dadosCliente

      // Verificar se CPF já existe
      const clienteExistente = await ClienteModel.buscarPorCpf(cpf)
      if (clienteExistente) {
        throw new Error("Cliente com este CPF já existe")
      }

      // Criar contato se fornecido
      let contatoId = null
      if (contato) {
        const contatoResult = await ContatoModel.create(contato)
        contatoId = contatoResult.id
      }

      // Criar endereço se fornecido
      let enderecoId = null
      if (endereco) {
        const enderecoResult = await EnderecoModel.create(endereco)
        enderecoId = enderecoResult.id
      }

      // Criar pessoa
      const pessoaId = await PessoaModel.criar({
        nome,
        contato_id: contatoId,
        endereco_id: enderecoId,
      })

      // Criar cliente
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

  static async listarClientes(incluirInativos = false) {
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

      const { nome, cpf, contato, endereco } = dadosCliente

      // Verificar se outro cliente já usa este CPF
      if (cpf !== clienteExistente.cpf) {
        const clienteComMesmoCpf = await ClienteModel.buscarPorCpf(cpf)
        if (clienteComMesmoCpf && clienteComMesmoCpf.cliente_id !== Number.parseInt(id)) {
          throw new Error("Cliente com este CPF já existe")
        }
      }

      // Atualizar ou criar contato
      let contatoId = clienteExistente.contato_id
      if (contato) {
        if (contatoId) {
          await ContatoModel.update(contatoId, contato)
        } else {
          const contatoResult = await ContatoModel.create(contato)
          contatoId = contatoResult.id
        }
      }

      // Atualizar ou criar endereço
      let enderecoId = clienteExistente.endereco_id
      if (endereco) {
        if (enderecoId) {
          await EnderecoModel.update(enderecoId, endereco)
        } else {
          const enderecoResult = await EnderecoModel.create(endereco)
          enderecoId = enderecoResult.id
        }
      }

      // Atualizar pessoa
      if (nome || contatoId !== clienteExistente.contato_id || enderecoId !== clienteExistente.endereco_id) {
        await PessoaModel.atualizar(clienteExistente.pessoa_id, {
          nome: nome || clienteExistente.nome,
          contato_id: contatoId,
          endereco_id: enderecoId,
          status: clienteExistente.pessoa_status,
        })
      }

      // Atualizar cliente
      const sucesso = await ClienteModel.atualizar(id, {
        cpf,
        status: dadosCliente.status !== undefined ? dadosCliente.status : clienteExistente.status,
      })

      if (!sucesso) {
        throw new Error("Erro ao atualizar cliente")
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
}

module.exports = ClienteService
