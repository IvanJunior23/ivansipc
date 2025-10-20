const FornecedorModel = require("../models/fornecedorModel")
const PessoaModel = require("../models/pessoaModel")
const { pool } = require("../../config/database")

class FornecedorService {
  static async criarFornecedor(dadosFornecedor) {
    console.log(" 🔍 Service criarFornecedor - Dados recebidos:", dadosFornecedor)

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const { pessoa_id, cnpj, created_by } = dadosFornecedor

      console.log(" 🔍 Service - pessoa_id:", pessoa_id, "tipo:", typeof pessoa_id)
      console.log(" 🔍 Service - cnpj:", cnpj, "tipo:", typeof cnpj)
      console.log(" 🔍 Service - created_by:", created_by, "tipo:", typeof created_by)

      // Verificar se pessoa existe e está ativa
      const pessoa = await PessoaModel.buscarPorId(pessoa_id)
      if (!pessoa) {
        throw new Error("Pessoa não encontrada ou inativa")
      }
      console.log(" ✅ Service - Pessoa encontrada:", pessoa.nome)

      // Verificar se pessoa já tem fornecedor associado
      const fornecedorExistente = await FornecedorModel.buscarPorPessoaId(pessoa_id)
      if (fornecedorExistente) {
        throw new Error("Esta pessoa já possui um fornecedor associado")
      }
      console.log(" ✅ Service - Pessoa não tem fornecedor associado")

      // Verificar se CNPJ já existe
      const cnpjExistente = await FornecedorModel.buscarPorCnpj(cnpj)
      if (cnpjExistente) {
        throw new Error("Este CNPJ já está cadastrado")
      }
      console.log(" ✅ Service - CNPJ disponível")

      // Criar fornecedor (status TRUE por padrão no banco)
      console.log(" 🔄 Service - Chamando Model.criar com:", { pessoa_id, cnpj, created_by })
      const fornecedorId = await FornecedorModel.criar({
        pessoa_id,
        cnpj,
        created_by,
      })
      console.log(" ✅ Service - Fornecedor criado com ID:", fornecedorId)

      await connection.commit()
      console.log(" ✅ Service - Transação commitada")

      return await FornecedorModel.buscarPorId(fornecedorId)
    } catch (error) {
      console.log(" ❌ Service - Erro:", error.message)
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
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const fornecedorExistente = await FornecedorModel.buscarPorId(id)
      if (!fornecedorExistente) {
        throw new Error("Fornecedor não encontrado")
      }

      const { cnpj, updated_by } = dadosFornecedor

      // Verificar se CNPJ já existe em outro fornecedor
      if (cnpj !== fornecedorExistente.cnpj) {
        const cnpjExistente = await FornecedorModel.buscarPorCnpj(cnpj)
        if (cnpjExistente && cnpjExistente.fornecedor_id !== id) {
          throw new Error("Este CNPJ já está cadastrado em outro fornecedor")
        }
      }

      const sucesso = await FornecedorModel.atualizar(id, {
        cnpj,
        updated_by,
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
    const connection = await pool.getConnection()
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

  static async ativarFornecedor(id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const fornecedor = await FornecedorModel.buscarPorId(id)
      if (!fornecedor) {
        throw new Error("Fornecedor não encontrado")
      }

      const sucesso = await FornecedorModel.ativar(id)
      if (!sucesso) {
        throw new Error("Erro ao ativar fornecedor")
      }

      await connection.commit()
      return { message: "Fornecedor ativado com sucesso" }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async updateFornecedorStatus(id, status) {
    console.log("🔄 Service: alterando apenas status do fornecedor ID:", id, "para:", status)

    const fornecedorExiste = await FornecedorModel.buscarPorId(id)

    if (!fornecedorExiste) {
      throw new Error("Fornecedor não encontrado")
    }

    const novoStatus = status === true || status === 1 || status === "1" ? 1 : 0
    console.log("🔄 Service: convertendo status para:", novoStatus)

    const result = await FornecedorModel.updateStatus(id, novoStatus)

    if (!result) {
      throw new Error("Erro ao atualizar status do fornecedor")
    }

    const fornecedorAtualizado = await FornecedorModel.buscarPorId(id)

    console.log("✅ Service: status alterado com sucesso:", fornecedorAtualizado)
    return fornecedorAtualizado
  }
}

module.exports = FornecedorService
