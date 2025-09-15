const TrocaModel = require("../models/trocaModel")
const VendaModel = require("../models/vendaModel")
const ItemVendaModel = require("../models/itemVendaModel")
const PecaModel = require("../models/pecaModel")

class TrocaService {
  static async criarTroca(dadosTroca) {
    const { venda_id, usuario_responsavel_id, peca_trocada_id, peca_substituta_id, quantidade, motivo_troca } =
      dadosTroca

    // Validar venda
    const venda = await VendaModel.buscarPorId(venda_id)
    if (!venda) {
      throw new Error("Venda não encontrada")
    }

    if (venda.status !== "concluida") {
      throw new Error("Só é possível fazer trocas em vendas concluídas")
    }

    // Validar peça trocada
    const pecaTrocada = await PecaModel.buscarPorId(peca_trocada_id)
    if (!pecaTrocada) {
      throw new Error("Peça a ser trocada não encontrada")
    }

    // Verificar se a peça trocada está na venda
    const itensVenda = await ItemVendaModel.buscarPorVendaId(venda_id)
    const itemTrocado = itensVenda.find((item) => item.peca_id === peca_trocada_id)
    if (!itemTrocado) {
      throw new Error("Peça não encontrada nesta venda")
    }

    // Verificar se a quantidade é válida
    if (quantidade <= 0 || quantidade > itemTrocado.quantidade) {
      throw new Error("Quantidade inválida para troca")
    }

    // Validar peça substituta se fornecida
    if (peca_substituta_id) {
      const pecaSubstituta = await PecaModel.buscarPorId(peca_substituta_id)
      if (!pecaSubstituta || !pecaSubstituta.status) {
        throw new Error("Peça substituta não encontrada ou inativa")
      }

      // Verificar estoque da peça substituta
      if (pecaSubstituta.quantidade_estoque < quantidade) {
        throw new Error(
          `Estoque insuficiente para a peça substituta ${pecaSubstituta.nome}. Disponível: ${pecaSubstituta.quantidade_estoque}`,
        )
      }
    }

    // Criar troca
    const trocaId = await TrocaModel.criar({
      venda_id,
      usuario_responsavel_id,
      peca_trocada_id,
      peca_substituta_id: peca_substituta_id || null,
      quantidade,
      motivo_troca,
    })

    return await TrocaModel.buscarPorId(trocaId)
  }

  static async buscarTrocaPorId(id) {
    const troca = await TrocaModel.buscarPorId(id)
    if (!troca) {
      throw new Error("Troca não encontrada")
    }
    return troca
  }

  static async listarTrocas(filtros = {}) {
    return await TrocaModel.buscarTodos(filtros)
  }

  static async buscarTrocasPorVenda(vendaId) {
    const venda = await VendaModel.buscarPorId(vendaId)
    if (!venda) {
      throw new Error("Venda não encontrada")
    }

    return await TrocaModel.buscarPorVendaId(vendaId)
  }
}

module.exports = TrocaService
