const PecaModel = require("../models/pecaModel")
const ImagemModel = require("../models/imagemModel")
const CategoriaModel = require("../models/categoriaModel")
const MarcaModel = require("../models/marcaModel")

class PecaService {
  static async gerarCodigoAutomatico(categoriaId, marcaId) {
    try {
      // Get category and brand info
      const categoria = categoriaId ? await CategoriaModel.buscarPorId(categoriaId) : null
      const marca = marcaId ? await MarcaModel.buscarPorId(marcaId) : null

      // Create prefix from category and brand initials
      const categoriaPrefix = categoria ? categoria.nome.substring(0, 3).toUpperCase() : "GEN"
      const marcaPrefix = marca ? marca.nome.substring(0, 3).toUpperCase() : "GEN"

      // Get the count of existing parts to generate sequential number
      const pecas = await PecaModel.buscarTodos(true) // Include inactive to get accurate count
      const sequencial = String(pecas.length + 1).padStart(4, "0")

      // Format: CAT-MAR-0001
      const codigo = `${categoriaPrefix}-${marcaPrefix}-${sequencial}`

      return codigo
    } catch (error) {
      console.error("Erro ao gerar código automático:", error)
      // Fallback to timestamp-based code if generation fails
      return `PEC-${Date.now()}`
    }
  }

  static async criarPeca(dadosPeca, imagens = []) {
    if (!dadosPeca.codigo || dadosPeca.codigo.trim() === "") {
      dadosPeca.codigo = await this.gerarCodigoAutomatico(dadosPeca.categoria_id, dadosPeca.marca_id)
      console.log("Código gerado automaticamente:", dadosPeca.codigo)
    }

    // Validar categoria se fornecida
    if (dadosPeca.categoria_id) {
      const categoria = await CategoriaModel.buscarPorId(dadosPeca.categoria_id)
      if (!categoria || !categoria.status) {
        throw new Error("Categoria não encontrada ou inativa")
      }
    }

    // Validar marca se fornecida
    if (dadosPeca.marca_id) {
      const marca = await MarcaModel.buscarPorId(dadosPeca.marca_id)
      if (!marca || !marca.status) {
        throw new Error("Marca não encontrada ou inativa")
      }
    }

    const pecaId = await PecaModel.criar(dadosPeca)

    if (dadosPeca.imagem_principal_id) {
      await PecaModel.adicionarImagem(pecaId, dadosPeca.imagem_principal_id)
    }

    // Adicionar imagens se fornecidas
    if (imagens && imagens.length > 0) {
      for (const imagemUrl of imagens) {
        const imagemId = await ImagemModel.criar({
          referencia_url: imagemUrl,
          descricao: `Imagem da peça ${dadosPeca.nome}`,
        })
        await PecaModel.adicionarImagem(pecaId, imagemId)
      }
    }

    return await PecaModel.buscarPorId(pecaId)
  }

  static async buscarPecaPorId(id) {
    const peca = await PecaModel.buscarPorId(id)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }
    return peca
  }

  static async listarPecas(incluirInativos = false, filtros = {}) {
    return await PecaModel.buscarTodos(incluirInativos, filtros)
  }

  static async atualizarPeca(id, dadosPeca) {
    const pecaExistente = await PecaModel.buscarPorId(id)
    if (!pecaExistente) {
      throw new Error("Peça não encontrada")
    }

    // Validar categoria se fornecida
    if (dadosPeca.categoria_id) {
      const categoria = await CategoriaModel.buscarPorId(dadosPeca.categoria_id)
      if (!categoria || !categoria.status) {
        throw new Error("Categoria não encontrada ou inativa")
      }
    }

    // Validar marca se fornecida
    if (dadosPeca.marca_id) {
      const marca = await MarcaModel.buscarPorId(dadosPeca.marca_id)
      if (!marca || !marca.status) {
        throw new Error("Marca não encontrada ou inativa")
      }
    }

    const sucesso = await PecaModel.atualizar(id, dadosPeca)
    if (!sucesso) {
      throw new Error("Erro ao atualizar peça")
    }

    return await PecaModel.buscarPorId(id)
  }

  static async inativarPeca(id) {
    const peca = await PecaModel.buscarPorId(id)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }

    const sucesso = await PecaModel.inativar(id)
    if (!sucesso) {
      throw new Error("Erro ao inativar peça")
    }

    return { message: "Peça inativada com sucesso" }
  }

  static async adicionarImagemPeca(pecaId, imagemUrl, descricao = null) {
    const peca = await PecaModel.buscarPorId(pecaId)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }

    const imagemId = await ImagemModel.criar({
      referencia_url: imagemUrl,
      descricao: descricao || `Imagem da peça ${peca.nome}`,
    })

    await PecaModel.adicionarImagem(pecaId, imagemId)

    return await ImagemModel.buscarPorId(imagemId)
  }

  static async removerImagemPeca(pecaId, imagemId) {
    const peca = await PecaModel.buscarPorId(pecaId)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }

    const imagem = await ImagemModel.buscarPorId(imagemId)
    if (!imagem) {
      throw new Error("Imagem não encontrada")
    }

    const sucesso = await PecaModel.removerImagem(pecaId, imagemId)
    if (!sucesso) {
      throw new Error("Erro ao remover imagem da peça")
    }

    // Inativar a imagem se não estiver sendo usada por outras peças
    await ImagemModel.inativar(imagemId)

    return { message: "Imagem removida com sucesso" }
  }

  static async buscarImagensPeca(pecaId) {
    const peca = await PecaModel.buscarPorId(pecaId)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }

    return await PecaModel.buscarImagensPeca(pecaId)
  }

  static async toggleStatus(id) {
    const peca = await PecaModel.buscarPorId(id)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }

    const novoStatus = !peca.status
    const sucesso = await PecaModel.updateStatus(id, novoStatus)

    if (!sucesso) {
      throw new Error("Erro ao alterar status da peça")
    }

    const pecaAtualizada = await PecaModel.buscarPorId(id)
    return {
      message: `Peça ${novoStatus ? "ativada" : "inativada"} com sucesso`,
      peca: pecaAtualizada,
    }
  }

  static async toggleStatusWithValue(id, statusValue) {
    const peca = await PecaModel.buscarPorId(id)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }

    const sucesso = await PecaModel.updateStatus(id, statusValue)

    if (!sucesso) {
      throw new Error("Erro ao alterar status da peça")
    }

    const pecaAtualizada = await PecaModel.buscarPorId(id)
    return {
      message: `Peça ${statusValue ? "ativada" : "inativada"} com sucesso`,
      peca: pecaAtualizada,
    }
  }

  static async getAllPecas() {
    const result = await PecaModel.buscarTodos(false) // Only active parts
    return result
  }

  static async vincularImagemPeca(pecaId, imagemId) {
    const peca = await PecaModel.buscarPorId(pecaId)
    if (!peca) {
      throw new Error("Peça não encontrada")
    }

    const imagem = await ImagemModel.buscarPorId(imagemId)
    if (!imagem) {
      throw new Error("Imagem não encontrada")
    }

    await PecaModel.adicionarImagem(pecaId, imagemId)

    return { message: "Imagem vinculada com sucesso" }
  }

  static async buscarPecasPorFornecedor(fornecedorId) {
    return await PecaModel.buscarTodos(false, { fornecedor_id: fornecedorId })
  }
}

module.exports = PecaService
