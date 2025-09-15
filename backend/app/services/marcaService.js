const MarcaModel = require("../models/marcaModel")

class MarcaService {
  static async criarMarca(dadosMarca) {
    // Verificar se marca já existe
    const marcaExistente = await MarcaModel.buscarPorNome(dadosMarca.nome)
    if (marcaExistente) {
      throw new Error("Marca com este nome já existe")
    }

    const marcaId = await MarcaModel.criar(dadosMarca)
    return await MarcaModel.buscarPorId(marcaId)
  }

  static async buscarMarcaPorId(id) {
    const marca = await MarcaModel.buscarPorId(id)
    if (!marca) {
      throw new Error("Marca não encontrada")
    }
    return marca
  }

  static async listarMarcas(incluirInativos = false) {
    return await MarcaModel.buscarTodos(incluirInativos)
  }

  static async atualizarMarca(id, dadosMarca) {
    const marcaExistente = await MarcaModel.buscarPorId(id)
    if (!marcaExistente) {
      throw new Error("Marca não encontrada")
    }

    // Verificar se outro registro já usa este nome
    const marcaComMesmoNome = await MarcaModel.buscarPorNome(dadosMarca.nome)
    if (marcaComMesmoNome && marcaComMesmoNome.marca_id !== Number.parseInt(id)) {
      throw new Error("Marca com este nome já existe")
    }

    const sucesso = await MarcaModel.atualizar(id, dadosMarca)
    if (!sucesso) {
      throw new Error("Erro ao atualizar marca")
    }

    return await MarcaModel.buscarPorId(id)
  }

  static async inativarMarca(id) {
    const marca = await MarcaModel.buscarPorId(id)
    if (!marca) {
      throw new Error("Marca não encontrada")
    }

    const sucesso = await MarcaModel.inativar(id)
    if (!sucesso) {
      throw new Error("Erro ao inativar marca")
    }

    return { message: "Marca inativada com sucesso" }
  }
}

module.exports = MarcaService
