const PessoaModel = require("../models/pessoaModel")
const ContatoModel = require("../models/contatoModel")
const EnderecoModel = require("../models/enderecoModel")
const db = require("../../config/database")

class PessoaService {
  static async criarPessoaCompleta(dadosPessoa) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      let contatoId = null
      let enderecoId = null

      // Criar contato se fornecido
      if (dadosPessoa.contato) {
        const contato = await ContatoModel.create(dadosPessoa.contato)  
        contatoId = contato.id
      }

      // Criar endereço se fornecido
      if (dadosPessoa.endereco) {
        const endereco = await EnderecoModel.create(dadosPessoa.endereco)
        enderecoId = endereco.id
      }

      // Criar pessoa com os IDs dos relacionamentos
      const pessoaData = {
        nome: dadosPessoa.nome,
        contato_id: contatoId,
        endereco_id: enderecoId,
        status: dadosPessoa.status !== undefined ? dadosPessoa.status : true,
      }

      const pessoaId = await PessoaModel.criar(pessoaData)

      await connection.commit()
      return pessoaId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async atualizarPessoaCompleta(pessoaId, dadosPessoa) {
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const pessoaAtual = await PessoaModel.buscarPorId(pessoaId)
      if (!pessoaAtual) {
        throw new Error("Pessoa não encontrada")
      }

      let contatoId = pessoaAtual.contato_id
      let enderecoId = pessoaAtual.endereco_id

      // Atualizar ou criar contato
      if (dadosPessoa.contato) {
        if (contatoId) {
          await ContatoModel.update(contatoId, dadosPessoa.contato)
        } else {
          const contato = await ContatoModel.create(dadosPessoa.contato)
          contatoId = contato.id
        }
      }

      // Atualizar ou criar endereço
      if (dadosPessoa.endereco) {
        if (enderecoId) {
          await EnderecoModel.update(enderecoId, dadosPessoa.endereco)
        } else {
          const endereco = await EnderecoModel.create(dadosPessoa.endereco)
          enderecoId = endereco.id
        }
      }

      // Atualizar pessoa
      const pessoaData = {
        nome: dadosPessoa.nome || pessoaAtual.nome,
        contato_id: contatoId,
        endereco_id: enderecoId,
        status: dadosPessoa.status !== undefined ? dadosPessoa.status : pessoaAtual.status,
      }

      await PessoaModel.atualizar(pessoaId, pessoaData)

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async buscarPessoaCompleta(pessoaId) {
    return await PessoaModel.buscarPorId(pessoaId)
  }

  static async listarPessoasCompletas(incluirInativos = false) {
    return await PessoaModel.buscarTodos(incluirInativos)
  }
}

module.exports = PessoaService
