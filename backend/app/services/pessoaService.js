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
        const temDadosContato = dadosPessoa.contato.telefone || dadosPessoa.contato.email

        if (temDadosContato) {
          console.log("📞 Criando contato:", dadosPessoa.contato)

          const contatoCriado = await ContatoModel.create({
            nome_completo: dadosPessoa.contato.nome_completo || dadosPessoa.nome,
            telefone: dadosPessoa.contato.telefone || null,
            email: dadosPessoa.contato.email || null,
            usuario_id: userId,
          })

          contatoId = contatoCriado.contato_id
          console.log("📞 Contato criado com ID:", contatoId)
        } else {
          console.log("📞 Nenhum dado de contato fornecido, pulando criação")
        }
      }

      if (dadosPessoa.endereco_id) {
        console.log("🏠 Usando endereço existente ID:", dadosPessoa.endereco_id)
        enderecoId = dadosPessoa.endereco_id
      } else if (dadosPessoa.endereco && Object.keys(dadosPessoa.endereco).length > 0) {
        const temDadosEndereco =
          (dadosPessoa.endereco.logradouro && dadosPessoa.endereco.logradouro.trim()) ||
          (dadosPessoa.endereco.cidade && dadosPessoa.endereco.cidade.trim()) ||
          (dadosPessoa.endereco.cep && dadosPessoa.endereco.cep.trim())

        if (temDadosEndereco) {
          console.log("🏠 Criando endereço com dados:", JSON.stringify(dadosPessoa.endereco, null, 2))

          try {
            const enderecoData = {
              logradouro: dadosPessoa.endereco.logradouro?.trim() || null,
              numero: dadosPessoa.endereco.numero?.trim() || null,
              complemento: dadosPessoa.endereco.complemento?.trim() || null,
              bairro: dadosPessoa.endereco.bairro?.trim() || null,
              cidade: dadosPessoa.endereco.cidade?.trim() || null,
              estado: dadosPessoa.endereco.estado || null,
              cep: dadosPessoa.endereco.cep?.trim() || null,
              created_by: userId,
            }

            console.log("🏠 Dados formatados para EnderecoModel.create:", JSON.stringify(enderecoData, null, 2))

            const enderecoCriado = await EnderecoModel.create(enderecoData)

            enderecoId = enderecoCriado.id
            console.log("🏠 Endereço criado com sucesso! ID:", enderecoId)
            console.log("🏠 Objeto retornado:", JSON.stringify(enderecoCriado, null, 2))

            if (!enderecoId) {
              throw new Error("EnderecoModel.create não retornou um ID válido")
            }
          } catch (enderecoError) {
            console.error("❌ Erro ao criar endereço:", enderecoError)
            console.error("❌ Stack trace:", enderecoError.stack)
            throw new Error(`Falha ao criar endereço: ${enderecoError.message}`)
          }
        } else {
          console.log("🏠 Nenhum dado essencial de endereço fornecido, pulando criação")
        }
      }

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

      console.log("👤 Criando pessoa com dados:", JSON.stringify(pessoaData, null, 2))
      const pessoaId = await PessoaModel.criar(pessoaData)
      console.log("👤 Pessoa criada com ID:", pessoaId)

      await connection.commit()
      console.log("✅ Transação commitada com sucesso")
      console.log("✅ Resumo: Pessoa ID:", pessoaId, "| Contato ID:", contatoId, "| Endereço ID:", enderecoId)

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
        const temDadosContato = dadosPessoa.contato.telefone || dadosPessoa.contato.email

        if (temDadosContato) {
          console.log("📞 Processando contato:", dadosPessoa.contato)

          if (contatoId) {
            console.log("📞 Atualizando contato existente ID:", contatoId)
            await ContatoModel.update(contatoId, {
              nome_completo: dadosPessoa.contato.nome_completo || dadosPessoa.nome,
              telefone: dadosPessoa.contato.telefone || null,
              email: dadosPessoa.contato.email || null,
            })
          } else {
            console.log("📞 Criando novo contato")
            const contatoCriado = await ContatoModel.create({
              nome_completo: dadosPessoa.contato.nome_completo || dadosPessoa.nome,
              telefone: dadosPessoa.contato.telefone || null,
              email: dadosPessoa.contato.email || null,
              usuario_id: userId,
            })
            contatoId = contatoCriado.contato_id
            console.log("📞 Novo contato criado com ID:", contatoId)
          }
        }
      }

      if (dadosPessoa.endereco_id !== undefined) {
        console.log("🏠 Usando endereço ID:", dadosPessoa.endereco_id)
        enderecoId = dadosPessoa.endereco_id
      } else if (dadosPessoa.endereco && Object.keys(dadosPessoa.endereco).length > 0) {
        const temDadosEndereco =
          (dadosPessoa.endereco.logradouro && dadosPessoa.endereco.logradouro.trim()) ||
          (dadosPessoa.endereco.cidade && dadosPessoa.endereco.cidade.trim()) ||
          (dadosPessoa.endereco.cep && dadosPessoa.endereco.cep.trim())

        if (temDadosEndereco) {
          console.log("🏠 Processando endereço:", JSON.stringify(dadosPessoa.endereco, null, 2))

          try {
            if (enderecoId) {
              console.log("🏠 Atualizando endereço existente ID:", enderecoId)
              await EnderecoModel.update(enderecoId, {
                logradouro: dadosPessoa.endereco.logradouro?.trim() || null,
                numero: dadosPessoa.endereco.numero?.trim() || null,
                complemento: dadosPessoa.endereco.complemento?.trim() || null,
                bairro: dadosPessoa.endereco.bairro?.trim() || null,
                cidade: dadosPessoa.endereco.cidade?.trim() || null,
                estado: dadosPessoa.endereco.estado || null,
                cep: dadosPessoa.endereco.cep?.trim() || null,
                updated_by: userId,
              })
            } else {
              console.log("🏠 Criando novo endereço")
              const enderecoCriado = await EnderecoModel.create({
                logradouro: dadosPessoa.endereco.logradouro?.trim() || null,
                numero: dadosPessoa.endereco.numero?.trim() || null,
                complemento: dadosPessoa.endereco.complemento?.trim() || null,
                bairro: dadosPessoa.endereco.bairro?.trim() || null,
                cidade: dadosPessoa.endereco.cidade?.trim() || null,
                estado: dadosPessoa.endereco.estado || null,
                cep: dadosPessoa.endereco.cep?.trim() || null,
                created_by: userId,
              })
              enderecoId = enderecoCriado.id
              console.log("🏠 Novo endereço criado com ID:", enderecoId)
            }
          } catch (enderecoError) {
            console.error("❌ Erro ao processar endereço:", enderecoError)
            console.error("❌ Stack trace:", enderecoError.stack)
            throw new Error(`Falha ao processar endereço: ${enderecoError.message}`)
          }
        }
      }

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
