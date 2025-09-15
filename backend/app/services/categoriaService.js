const CategoriaModel = require("../models/categoriaModel")

class CategoriaService {
  static async criarCategoria(dadosCategoria) {
    // Verificar se categoria já existe
    const categoriaExistente = await CategoriaModel.buscarPorNome(dadosCategoria.nome)
    if (categoriaExistente) {
      throw new Error("Categoria com este nome já existe")
    }

    const categoriaId = await CategoriaModel.criar(dadosCategoria)
    return await CategoriaModel.buscarPorId(categoriaId)
  }

  static async buscarCategoriaPorId(id) {
    const categoria = await CategoriaModel.buscarPorId(id)
    if (!categoria) {
      throw new Error("Categoria não encontrada")
    }
    return categoria
  }

  static async listarCategorias(incluirInativos = false) {
    return await CategoriaModel.buscarTodos(incluirInativos)
  }

  static async atualizarCategoria(id, dadosCategoria) {
    const categoriaExistente = await CategoriaModel.buscarPorId(id)
    if (!categoriaExistente) {
      throw new Error("Categoria não encontrada")
    }

    // Verificar se outro registro já usa este nome
    const categoriaComMesmoNome = await CategoriaModel.buscarPorNome(dadosCategoria.nome)
    if (categoriaComMesmoNome && categoriaComMesmoNome.categoria_id !== Number.parseInt(id)) {
      throw new Error("Categoria com este nome já existe")
    }

    const sucesso = await CategoriaModel.atualizar(id, dadosCategoria)
    if (!sucesso) {
      throw new Error("Erro ao atualizar categoria")
    }

    return await CategoriaModel.buscarPorId(id)
  }

  static async inativarCategoria(id) {
    const categoria = await CategoriaModel.buscarPorId(id)
    if (!categoria) {
      throw new Error("Categoria não encontrada")
    }

    const sucesso = await CategoriaModel.inativar(id)
    if (!sucesso) {
      throw new Error("Erro ao inativar categoria")
    }

    return { message: "Categoria inativada com sucesso" }
  }
}

module.exports = CategoriaService
