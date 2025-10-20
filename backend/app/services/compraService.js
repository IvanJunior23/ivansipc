const CompraModel = require("../models/compraModel")
const ItemCompraModel = require("../models/itemCompraModel")
const FornecedorModel = require("../models/fornecedorModel")
const PecaModel = require("../models/pecaModel")

class CompraService {
  static async criarCompra(dadosCompra, itens) {
    const { fornecedor_id, usuario_id, data_compra, observacoes } = dadosCompra

    // Validar fornecedor
    const fornecedor = await FornecedorModel.buscarPorId(fornecedor_id)
    if (!fornecedor) {
      throw new Error("Fornecedor não encontrado")
    }

    // Validar itens e calcular valor total
    if (!itens || itens.length === 0) {
      throw new Error("Compra deve ter pelo menos um item")
    }

    let valorTotal = 0
    for (const item of itens) {
      // Validar peça
      const peca = await PecaModel.buscarPorId(item.peca_id)
      if (!peca) {
        throw new Error(`Peça com ID ${item.peca_id} não encontrada`)
      }

      // Validar quantidade
      if (!item.quantidade || item.quantidade <= 0) {
        throw new Error("Quantidade deve ser maior que zero")
      }

      // Validar valor unitário
      if (!item.valor_unitario || item.valor_unitario <= 0) {
        throw new Error("Valor unitário deve ser maior que zero")
      }

      valorTotal += item.quantidade * item.valor_unitario
    }

    // Criar compra
    const compraId = await CompraModel.criar({
      fornecedor_id,
      usuario_id: usuario_id || 1, // Default to user 1 if not provided
      data_compra: data_compra || new Date().toISOString().split("T")[0],
      valor_total: valorTotal,
      status: "pendente",
      observacoes: observacoes || null,
    })

    // Criar itens da compra
    for (const item of itens) {
      await ItemCompraModel.criar({
        compra_id: compraId,
        peca_id: item.peca_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      })
    }

    return await this.buscarCompraPorId(compraId)
  }

  static async buscarCompraPorId(id) {
    const compra = await CompraModel.buscarPorId(id)
    if (!compra) {
      throw new Error("Compra não encontrada")
    }

    // Buscar itens da compra
    const itens = await ItemCompraModel.buscarPorCompraId(id)
    compra.itens = itens

    return compra
  }

  static async listarCompras(filtros = {}) {
    return await CompraModel.buscarTodos(filtros)
  }

  static async atualizarCompra(id, dadosCompra, itens) {
    const compraExistente = await CompraModel.buscarPorId(id)
    if (!compraExistente) {
      throw new Error("Compra não encontrada")
    }

    // Não permitir atualizar compras já recebidas
    if (compraExistente.status === "recebida") {
      throw new Error("Não é possível atualizar compras já recebidas")
    }

    const { fornecedor_id, data_compra } = dadosCompra

    // Validar fornecedor se fornecido
    if (fornecedor_id) {
      const fornecedor = await FornecedorModel.buscarPorId(fornecedor_id)
      if (!fornecedor) {
        throw new Error("Fornecedor não encontrado")
      }
    }

    // Se itens foram fornecidos, recalcular valor total
    let valorTotal = compraExistente.valor_total
    if (itens && itens.length > 0) {
      // Remover itens existentes
      await ItemCompraModel.deletarPorCompraId(id)

      // Validar e criar novos itens
      valorTotal = 0
      for (const item of itens) {
        const peca = await PecaModel.buscarPorId(item.peca_id)
        if (!peca) {
          throw new Error(`Peça com ID ${item.peca_id} não encontrada`)
        }

        if (!item.quantidade || item.quantidade <= 0) {
          throw new Error("Quantidade deve ser maior que zero")
        }

        if (!item.valor_unitario || item.valor_unitario <= 0) {
          throw new Error("Valor unitário deve ser maior que zero")
        }

        valorTotal += item.quantidade * item.valor_unitario

        await ItemCompraModel.criar({
          compra_id: id,
          peca_id: item.peca_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        })
      }
    }

    // Atualizar compra
    const sucesso = await CompraModel.atualizar(id, {
      fornecedor_id: fornecedor_id || compraExistente.fornecedor_id,
      data_compra: data_compra || compraExistente.data_compra,
      valor_total: valorTotal,
      status: compraExistente.status,
    })

    if (!sucesso) {
      throw new Error("Erro ao atualizar compra")
    }

    return await this.buscarCompraPorId(id)
  }

  static async receberCompra(id) {
    const compra = await CompraModel.buscarPorId(id)
    if (!compra) {
      throw new Error("Compra não encontrada")
    }

    if (compra.status === "recebida") {
      throw new Error("Compra já foi recebida")
    }

    if (compra.status === "cancelada") {
      throw new Error("Não é possível receber compra cancelada")
    }

    // Atualizar status para recebida
    const sucesso = await CompraModel.atualizarStatus(id, "recebida")
    if (!sucesso) {
      throw new Error("Erro ao receber compra")
    }

    return { message: "Compra recebida com sucesso" }
  }

  static async cancelarCompra(id) {
    const compra = await CompraModel.buscarPorId(id)
    if (!compra) {
      throw new Error("Compra não encontrada")
    }

    if (compra.status === "recebida") {
      throw new Error("Não é possível cancelar compra já recebida")
    }

    if (compra.status === "cancelada") {
      throw new Error("Compra já foi cancelada")
    }

    // Atualizar status para cancelada
    const sucesso = await CompraModel.atualizarStatus(id, "cancelada")
    if (!sucesso) {
      throw new Error("Erro ao cancelar compra")
    }

    return { message: "Compra cancelada com sucesso" }
  }

  static async buscarItensCompra(compraId) {
    const compra = await CompraModel.buscarPorId(compraId)
    if (!compra) {
      throw new Error("Compra não encontrada")
    }

    return await ItemCompraModel.buscarPorCompraId(compraId)
  }
}

module.exports = CompraService
