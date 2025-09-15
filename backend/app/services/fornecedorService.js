const FornecedorModel = require("../models/fornecedorModel")
const PessoaModel = require("../models/pessoaModel")
const ContatoModel = require("../models/contatoModel")
const EnderecoModel = require("../models/enderecoModel")
const db = require("../../config/database")

class FornecedorService {
  static async criarFornecedor(dadosFornecedor) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const { nome, cnpj, contato, endereco } = dadosFornecedor

      // Verificar se CNPJ já existe
      const fornecedorExistente = await FornecedorModel.buscarPorCnpj(cnpj)
      if (fornecedorExistente) {
        throw new Error("Fornecedor com este CNPJ já existe")
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

      // Criar fornecedor
      const fornecedorId = await FornecedorModel.criar({
        pessoa_id: pessoaId,
        cnpj,
      })

      await connection.commit()
      return await FornecedorModel.buscarPorId(fornecedorId)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async buscarFornecedorPorId(id) {
    const fornecedor = await FornecedorModel.buscarPorId(id)
    if (!fornecedor) {
      throw new Error("Fornecedor não encontrado")
    }
    return fornecedor
  }

  static async listarFornecedores(incluirInativos = false) {
    return await FornecedorModel.buscarTodos(incluirInativos)
  }

  static async atualizarFornecedor(id, dadosFornecedor) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const fornecedorExistente = await FornecedorModel.buscarPorId(id)
      if (!fornecedorExistente) {
        throw new Error("Fornecedor não encontrado")
      }

      const { nome, cnpj, contato, endereco } = dadosFornecedor

      // Verificar se outro fornecedor já usa este CNPJ
      if (cnpj !== fornecedorExistente.cnpj) {
        const fornecedorComMesmoCnpj = await FornecedorModel.buscarPorCnpj(cnpj)
        if (fornecedorComMesmoCnpj && fornecedorComMesmoCnpj.fornecedor_id !== Number.parseInt(id)) {
          throw new Error("Fornecedor com este CNPJ já existe")
        }
      }

      let contatoId = fornecedorExistente.contato_id
      let enderecoId = fornecedorExistente.endereco_id

      // Atualizar ou criar contato
      if (contato) {
        if (contatoId) {
          await ContatoModel.update(contatoId, contato)
        } else {
          const contatoResult = await ContatoModel.create(contato)
          contatoId = contatoResult.id
        }
      }

      // Atualizar ou criar endereço
      if (endereco) {
        if (enderecoId) {
          await EnderecoModel.update(enderecoId, endereco)
        } else {
          const enderecoResult = await EnderecoModel.create(endereco)
          enderecoId = enderecoResult.id
        }
      }

      // Atualizar pessoa
      if (nome || contatoId !== fornecedorExistente.contato_id || enderecoId !== fornecedorExistente.endereco_id) {
        await PessoaModel.atualizar(fornecedorExistente.pessoa_id, {
          nome: nome || fornecedorExistente.nome,
          contato_id: contatoId,
          endereco_id: enderecoId,
          status: fornecedorExistente.pessoa_status,
        })
      }

      // Atualizar fornecedor
      const sucesso = await FornecedorModel.atualizar(id, {
        cnpj,
        status: dadosFornecedor.status !== undefined ? dadosFornecedor.status : fornecedorExistente.status,
      })

      if (!sucesso) {
        throw new Error("Erro ao atualizar fornecedor")
      }

      await connection.commit()
      return await FornecedorModel.buscarPorId(id)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async inativarFornecedor(id) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const fornecedor = await FornecedorModel.buscarPorId(id)
      if (!fornecedor) {
        throw new Error("Fornecedor não encontrado")
      }

      const sucesso = await FornecedorModel.inativar(id)
      if (!sucesso) {
        throw new Error("Erro ao inativar fornecedor")
      }

      await connection.commit()
      return { message: "Fornecedor inativado com sucesso" }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}

module.exports = FornecedorService
