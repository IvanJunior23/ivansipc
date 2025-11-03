const VendaModel = require("../models/vendaModel")
const ItemVendaModel = require("../models/itemVendaModel")
const ClienteModel = require("../models/clienteModel")
const PecaModel = require("../models/pecaModel")
const FormaPagamentoModel = require("../models/formaPagamentoModel")

class VendaService {
  static async criarVenda(dadosVenda, itens) {
    const { cliente_id, usuario_id, forma_pagamento_id, desconto_aplicado } = dadosVenda

    console.log(" === CRIANDO VENDA ===")
    console.log(" Dados da venda:", dadosVenda)
    console.log(" Itens:", itens)

    // Validar cliente
    const cliente = await ClienteModel.buscarPorId(cliente_id)
    if (!cliente || !cliente.status) {
      throw new Error("Cliente não encontrado ou inativo")
    }

    // Validar forma de pagamento
    const formaPagamento = await FormaPagamentoModel.buscarPorId(forma_pagamento_id)
    if (!formaPagamento || !formaPagamento.status) {
      throw new Error("Forma de pagamento não encontrada ou inativa")
    }

    // Validar itens e calcular valor total
    if (!itens || itens.length === 0) {
      throw new Error("Venda deve ter pelo menos um item")
    }

    let valorTotal = 0
    for (const item of itens) {
      // Validar peça
      const peca = await PecaModel.buscarPorId(item.peca_id)
      if (!peca || !peca.status) {
        throw new Error(`Peça com ID ${item.peca_id} não encontrada ou inativa`)
      }

      console.log(` Peça ${peca.nome} - Estoque ANTES: ${peca.quantidade_estoque}`)

      // Verificar estoque disponível
      if (peca.quantidade_estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para a peça ${peca.nome}. Disponível: ${peca.quantidade_estoque}`)
      }

      // Validar quantidade
      if (!item.quantidade || item.quantidade <= 0) {
        throw new Error("Quantidade deve ser maior que zero")
      }

      // Validar valor unitário
      if (!item.valor_unitario || item.valor_unitario <= 0) {
        throw new Error("Valor unitário deve ser maior que zero")
      }

      const subtotal = item.quantidade * item.valor_unitario - (item.desconto_item || 0)
      valorTotal += subtotal
    }

    // Aplicar desconto geral
    valorTotal -= desconto_aplicado || 0

    if (valorTotal < 0) {
      throw new Error("Valor total da venda não pode ser negativo")
    }

    // Criar venda
    const vendaId = await VendaModel.criar({
      cliente_id,
      usuario_id,
      forma_pagamento_id,
      valor_total: valorTotal,
      desconto_aplicado: desconto_aplicado || 0,
      status: "pendente",
    })

    console.log(` Venda criada com ID: ${vendaId} e status: pendente`)
    console.log(" ESTOQUE NÃO FOI ALTERADO - venda está pendente")

    // Criar itens da venda
    for (const item of itens) {
      await ItemVendaModel.criar({
        venda_id: vendaId,
        peca_id: item.peca_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        desconto_item: item.desconto_item || 0,
      })
    }

    return await this.buscarVendaPorId(vendaId)
  }

  static async buscarVendaPorId(id) {
    const venda = await VendaModel.buscarPorId(id)
    if (!venda) {
      throw new Error("Venda não encontrada")
    }

    // Buscar itens da venda
    const itens = await ItemVendaModel.buscarPorVendaId(id)
    venda.itens = itens

    return venda
  }

  static async listarVendas(filtros = {}) {
    return await VendaModel.buscarTodos(filtros)
  }

  static async atualizarVenda(id, dadosVenda, itens) {
    const vendaExistente = await VendaModel.buscarPorId(id)
    if (!vendaExistente) {
      throw new Error("Venda não encontrada")
    }

    // Não permitir atualizar vendas já concluídas
    if (vendaExistente.status === "concluida") {
      throw new Error("Não é possível atualizar vendas já concluídas")
    }

    const { cliente_id, forma_pagamento_id, desconto_aplicado } = dadosVenda

    // Validar cliente se fornecido
    if (cliente_id) {
      const cliente = await ClienteModel.buscarPorId(cliente_id)
      if (!cliente || !cliente.status) {
        throw new Error("Cliente não encontrado ou inativo")
      }
    }

    // Validar forma de pagamento se fornecida
    if (forma_pagamento_id) {
      const formaPagamento = await FormaPagamentoModel.buscarPorId(forma_pagamento_id)
      if (!formaPagamento || !formaPagamento.status) {
        throw new Error("Forma de pagamento não encontrada ou inativa")
      }
    }

    // Se itens foram fornecidos, recalcular valor total
    let valorTotal = vendaExistente.valor_total
    if (itens && itens.length > 0) {
      // Remover itens existentes
      await ItemVendaModel.deletarPorVendaId(id)

      // Validar e criar novos itens
      valorTotal = 0
      for (const item of itens) {
        const peca = await PecaModel.buscarPorId(item.peca_id)
        if (!peca || !peca.status) {
          throw new Error(`Peça com ID ${item.peca_id} não encontrada ou inativa`)
        }

        if (peca.quantidade_estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para a peça ${peca.nome}. Disponível: ${peca.quantidade_estoque}`)
        }

        if (!item.quantidade || item.quantidade <= 0) {
          throw new Error("Quantidade deve ser maior que zero")
        }

        if (!item.valor_unitario || item.valor_unitario <= 0) {
          throw new Error("Valor unitário deve ser maior que zero")
        }

        const subtotal = item.quantidade * item.valor_unitario - (item.desconto_item || 0)
        valorTotal += subtotal

        await ItemVendaModel.criar({
          venda_id: id,
          peca_id: item.peca_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          desconto_item: item.desconto_item || 0,
        })
      }

      // Aplicar desconto geral
      valorTotal -= desconto_aplicado || 0

      if (valorTotal < 0) {
        throw new Error("Valor total da venda não pode ser negativo")
      }
    }

    // Atualizar venda
    const sucesso = await VendaModel.atualizar(id, {
      cliente_id: cliente_id || vendaExistente.cliente_id,
      forma_pagamento_id: forma_pagamento_id || vendaExistente.forma_pagamento_id,
      valor_total: valorTotal,
      desconto_aplicado: desconto_aplicado !== undefined ? desconto_aplicado : vendaExistente.desconto_aplicado,
      status: vendaExistente.status,
    })

    if (!sucesso) {
      throw new Error("Erro ao atualizar venda")
    }

    return await this.buscarVendaPorId(id)
  }

  static async concluirVenda(id) {
    const venda = await VendaModel.buscarPorId(id)
    if (!venda) {
      throw new Error("Venda não encontrada")
    }

    if (venda.status === "concluida") {
      throw new Error("Venda já foi concluída")
    }

    if (venda.status === "cancelada") {
      throw new Error("Não é possível concluir venda cancelada")
    }

    // Atualizar status para concluída
    const sucesso = await VendaModel.atualizarStatus(id, "concluida")
    if (!sucesso) {
      throw new Error("Erro ao concluir venda")
    }

    return { message: "Venda concluída com sucesso" }
  }

  static async finalizarVenda(id) {
    const venda = await VendaModel.buscarPorId(id)
    if (!venda) {
      throw new Error("Venda não encontrada")
    }

    console.log(` === FINALIZANDO VENDA ${id} ===`)
    console.log(` Status atual: ${venda.status}`)

    if (venda.status === "concluida") {
      throw new Error("Venda já foi finalizada")
    }

    if (venda.status === "cancelada") {
      throw new Error("Não é possível finalizar venda cancelada")
    }

    // Get sale items
    const itens = await ItemVendaModel.buscarPorVendaId(id)

    console.log(` Itens da venda: ${itens.length}`)

    // Reduce stock for each item
    for (const item of itens) {
      const peca = await PecaModel.buscarPorId(item.peca_id)
      if (!peca) {
        throw new Error(`Peça com ID ${item.peca_id} não encontrada`)
      }

      console.log(` Peça ${peca.nome}:`)
      console.log(`   - Estoque ANTES: ${peca.quantidade_estoque}`)
      console.log(`   - Quantidade vendida: ${item.quantidade}`)

      // Check if there's enough stock
      if (peca.quantidade_estoque < item.quantidade) {
        throw new Error(
          `Estoque insuficiente para a peça ${peca.nome}. Disponível: ${peca.quantidade_estoque}, Necessário: ${item.quantidade}`,
        )
      }

      // Reduce stock
      const novaQuantidade = peca.quantidade_estoque - item.quantidade
      await PecaModel.atualizar(item.peca_id, {
        ...peca,
        quantidade_estoque: novaQuantidade,
      })

      console.log(`   - Estoque DEPOIS: ${novaQuantidade}`)
      console.log(`   - ESTOQUE BAIXADO COM SUCESSO`)
    }

    // Update status to finalized
    const sucesso = await VendaModel.atualizarStatus(id, "concluida")
    if (!sucesso) {
      throw new Error("Erro ao finalizar venda")
    }

    console.log(` Venda ${id} finalizada com sucesso`)
    console.log(" === FIM DA FINALIZAÇÃO ===")

    return { message: "Venda finalizada com sucesso e estoque atualizado" }
  }

  static async cancelarVenda(id) {
    const venda = await VendaModel.buscarPorId(id)
    if (!venda) {
      throw new Error("Venda não encontrada")
    }

    if (venda.status === "cancelada") {
      throw new Error("Venda já foi cancelada")
    }

    if (venda.status === "concluida") {
      const itens = await ItemVendaModel.buscarPorVendaId(id)

      for (const item of itens) {
        const peca = await PecaModel.buscarPorId(item.peca_id)
        if (peca) {
          // Return stock
          const novaQuantidade = peca.quantidade_estoque + item.quantidade
          await PecaModel.atualizar(item.peca_id, {
            ...peca,
            quantidade_estoque: novaQuantidade,
          })
        }
      }
    }

    // Update status to canceled
    const sucesso = await VendaModel.atualizarStatus(id, "cancelada")
    if (!sucesso) {
      throw new Error("Erro ao cancelar venda")
    }

    return {
      message:
        venda.status === "concluida"
          ? "Venda cancelada com sucesso e estoque revertido"
          : "Venda cancelada com sucesso",
    }
  }

  static async buscarItensVenda(vendaId) {
    const venda = await VendaModel.buscarPorId(vendaId)
    if (!venda) {
      throw new Error("Venda não encontrada")
    }

    return await ItemVendaModel.buscarPorVendaId(vendaId)
  }
}

module.exports = VendaService
