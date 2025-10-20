const PessoaModel = require("../models/pessoaModel")
const ContatoModel = require("../models/contatoModel")
const EnderecoModel = require("../models/enderecoModel")
const { pool } = require("../../config/database")

class PessoaService {
  static async criarPessoaCompleta(dadosPessoa, userId = null) {
    const connection = await pool.getConnection()

    try {
      console.log("🔧 Iniciando transação para criar pessoa completa")
      console.log("📝 Dados recebidos:", JSON.stringify(dadosPessoa, null, 2))

      await connection.beginTransaction()

      let contatoId = null
      let enderecoId = null

      if (dadosPessoa.contato_id) {
        console.log("📞 Usando contato existente ID:", dadosPessoa.contato_id)
        contatoId = dadosPessoa.contato_id
      } else if (dadosPessoa.contato && Object.keys(dadosPessoa.contato).length > 0) {
        console.log("📞 Criando contato:", dadosPessoa.contato)

        if (ContatoModel.create) {
          const resultado = await ContatoModel.create({
            ...dadosPessoa.contato,
            created_by: userId,
          })
          contatoId = resultado.id
        }

        console.log("📞 Contato criado com ID:", contatoId)
      }

      if (dadosPessoa.endereco_id) {
        console.log("🏠 Usando endereço existente ID:", dadosPessoa.endereco_id)
        enderecoId = dadosPessoa.endereco_id
      } else if (dadosPessoa.endereco && Object.keys(dadosPessoa.endereco).length > 0) {
        console.log("🏠 Criando endereço:", dadosPessoa.endereco)

        if (EnderecoModel.create) {
          const resultado = await EnderecoModel.create({
            ...dadosPessoa.endereco,
            created_by: userId,
          })
          enderecoId = resultado.id
        }

        console.log("🏠 Endereço criado com ID:", enderecoId)
      }

      // Criar pessoa com os IDs dos relacionamentos
      const pessoaData = {
        nome: dadosPessoa.pessoa?.nome || dadosPessoa.nome,
        contato_id: contatoId,
        endereco_id: enderecoId,
        status:
          dadosPessoa.pessoa?.status !== undefined
            ? dadosPessoa.pessoa.status
            : dadosPessoa.status !== undefined
              ? dadosPessoa.status
              : true,
      }

      console.log("👤 Criando pessoa:", pessoaData)
      const pessoaId = await PessoaModel.criar(pessoaData)
      console.log("👤 Pessoa criada com ID:", pessoaId)

      await connection.commit()
      console.log("✅ Transação commitada com sucesso")

      return pessoaId
    } catch (error) {
      console.error("❌ Erro na criação da pessoa completa:", error)
      await connection.rollback()
      console.log("🔄 Transação revertida")
      throw error
    } finally {
      connection.release()
      console.log("🔌 Conexão liberada")
    }
  }

  static async atualizarPessoaCompleta(pessoaId, dadosPessoa, userId = null) {
    const connection = await pool.getConnection()

    try {
      console.log("🔧 Iniciando transação para atualizar pessoa completa ID:", pessoaId)
      await connection.beginTransaction()

      // Buscar pessoa atual com todos os dados
      const pessoaAtual = await PessoaModel.buscarPorId(pessoaId)
      if (!pessoaAtual) {
        throw new Error("Pessoa não encontrada")
      }

      console.log("👤 Pessoa atual encontrada:", pessoaAtual.nome)

      let contatoId = pessoaAtual.contato_id
      let enderecoId = pessoaAtual.endereco_id

      if (dadosPessoa.contato_id !== undefined) {
        console.log("📞 Usando contato ID:", dadosPessoa.contato_id)
        contatoId = dadosPessoa.contato_id
      } else if (dadosPessoa.contato && Object.keys(dadosPessoa.contato).length > 0) {
        console.log("📞 Processando contato:", dadosPessoa.contato)

        if (contatoId && ContatoModel.update) {
          console.log("📞 Atualizando contato existente ID:", contatoId)
          await ContatoModel.update(contatoId, {
            ...dadosPessoa.contato,
            updated_by: userId,
          })
        } else if (ContatoModel.create) {
          console.log("📞 Criando novo contato")
          const resultado = await ContatoModel.create({
            ...dadosPessoa.contato,
            created_by: userId,
          })
          contatoId = resultado.id
          console.log("📞 Novo contato criado com ID:", contatoId)
        }
      }

      if (dadosPessoa.endereco_id !== undefined) {
        console.log("🏠 Usando endereço ID:", dadosPessoa.endereco_id)
        enderecoId = dadosPessoa.endereco_id
      } else if (dadosPessoa.endereco && Object.keys(dadosPessoa.endereco).length > 0) {
        console.log("🏠 Processando endereço:", dadosPessoa.endereco)

        if (enderecoId && EnderecoModel.update) {
          console.log("🏠 Atualizando endereço existente ID:", enderecoId)
          await EnderecoModel.update(enderecoId, {
            ...dadosPessoa.endereco,
            updated_by: userId,
          })
        } else if (EnderecoModel.create) {
          console.log("🏠 Criando novo endereço")
          const resultado = await EnderecoModel.create({
            ...dadosPessoa.endereco,
            created_by: userId,
          })
          enderecoId = resultado.id
          console.log("🏠 Novo endereço criado com ID:", enderecoId)
        }
      }

      // Atualizar pessoa
      const pessoaData = {
        nome: dadosPessoa.pessoa?.nome || dadosPessoa.nome || pessoaAtual.nome,
        contato_id: contatoId,
        endereco_id: enderecoId,
        status:
          dadosPessoa.pessoa?.status !== undefined
            ? dadosPessoa.pessoa.status
            : dadosPessoa.status !== undefined
              ? dadosPessoa.status
              : pessoaAtual.status,
      }

      console.log("👤 Atualizando pessoa com dados:", pessoaData)
      const resultado = await PessoaModel.atualizar(pessoaId, pessoaData)

      await connection.commit()
      console.log("✅ Transação de atualização commitada com sucesso")

      return resultado
    } catch (error) {
      console.error("❌ Erro na atualização da pessoa completa:", error)
      await connection.rollback()
      console.log("🔄 Transação revertida")
      throw error
    } finally {
      connection.release()
      console.log("🔌 Conexão liberada")
    }
  }

  static async buscarPessoaCompleta(pessoaId) {
    try {
      console.log("🔍 Buscando pessoa completa ID:", pessoaId)

      const pessoa = await PessoaModel.buscarPorId(pessoaId)

      if (!pessoa) {
        console.log("❌ Pessoa não encontrada")
        return null
      }

      console.log("✅ Pessoa encontrada:", pessoa.nome)

      // Estruturar os dados de forma organizada
      const pessoaCompleta = {
        pessoa_id: pessoa.pessoa_id,
        nome: pessoa.nome,
        status: pessoa.status,
        contato_id: pessoa.contato_id,
        endereco_id: pessoa.endereco_id,

        contato:
          pessoa.nome_completo || pessoa.telefone || pessoa.email
            ? {
                nome_completo: pessoa.nome_completo,
                telefone: pessoa.telefone,
                email: pessoa.email,
              }
            : null,

        endereco:
          pessoa.logradouro || pessoa.cidade
            ? {
                logradouro: pessoa.logradouro,
                numero: pessoa.numero,
                complemento: pessoa.complemento,
                bairro: pessoa.bairro,
                cidade: pessoa.cidade,
                estado: pessoa.estado,
                cep: pessoa.cep,
              }
            : null,
      }

      return pessoaCompleta
    } catch (error) {
      console.error("❌ Erro ao buscar pessoa completa:", error)
      throw error
    }
  }

  static async listarPessoasCompletas(incluirInativos = false) {
    try {
      console.log("📋 Listando pessoas completas, incluir inativos:", incluirInativos)

      const pessoas = await PessoaModel.buscarTodos(incluirInativos)

      console.log("✅ Pessoas encontradas:", pessoas.length)

      const pessoasCompletas = pessoas.map((pessoa) => ({
        pessoa_id: pessoa.pessoa_id,
        nome: pessoa.nome,
        status: pessoa.status,
        contato_id: pessoa.contato_id,
        endereco_id: pessoa.endereco_id,

        contato:
          pessoa.nome_completo || pessoa.telefone || pessoa.email
            ? {
                nome_completo: pessoa.nome_completo,
                telefone: pessoa.telefone,
                email: pessoa.email,
              }
            : null,

        endereco:
          pessoa.logradouro || pessoa.cidade
            ? {
                logradouro: pessoa.logradouro,
                numero: pessoa.numero,
                complemento: pessoa.complemento,
                bairro: pessoa.bairro,
                cidade: pessoa.cidade,
                estado: pessoa.estado,
                cep: pessoa.cep,
              }
            : null,
      }))

      return pessoasCompletas
    } catch (error) {
      console.error("❌ Erro ao listar pessoas completas:", error)
      throw error
    }
  }

  static async alterarStatusPessoa(pessoaId, novoStatus, userId = null) {
    try {
      console.log("🔄 Alterando status da pessoa ID:", pessoaId, "para:", novoStatus)

      const pessoaAtual = await PessoaModel.buscarPorId(pessoaId)
      if (!pessoaAtual) {
        throw new Error("Pessoa não encontrada")
      }

      const statusBoolean = novoStatus === 1 || novoStatus === true || novoStatus === "true"

      const dadosAtualizacao = {
        nome: pessoaAtual.nome,
        contato_id: pessoaAtual.contato_id,
        endereco_id: pessoaAtual.endereco_id,
        status: statusBoolean,
      }

      const resultado = await PessoaModel.atualizar(pessoaId, dadosAtualizacao)
      console.log("✅ Status da pessoa alterado com sucesso")

      return resultado
    } catch (error) {
      console.error("❌ Erro ao alterar status da pessoa:", error)
      throw error
    }
  }

  static async excluirPessoaCompleta(pessoaId, userId = null) {
    try {
      console.log("🗑️ Excluindo pessoa ID:", pessoaId)

      const pessoaAtual = await PessoaModel.buscarPorId(pessoaId)
      if (!pessoaAtual) {
        throw new Error("Pessoa não encontrada")
      }

      const resultado = await PessoaModel.inativar(pessoaId)
      console.log("✅ Pessoa marcada como inativa com sucesso")

      return resultado
    } catch (error) {
      console.error("❌ Erro na exclusão da pessoa:", error)
      throw error
    }
  }
}

module.exports = PessoaService
