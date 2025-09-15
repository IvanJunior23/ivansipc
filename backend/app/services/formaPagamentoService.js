const FormaPagamentoModel = require("../models/formaPagamentoModel")

class FormaPagamentoService {
  static async criarFormaPagamento(dadosFormaPagamento) {
    // Verificar se forma de pagamento já existe
    const formaPagamentoExistente = await FormaPagamentoModel.buscarPorNome(dadosFormaPagamento.nome)
    if (formaPagamentoExistente) {
      throw new Error("Forma de pagamento com este nome já existe")
    }

    const formaPagamentoId = await FormaPagamentoModel.criar(dadosFormaPagamento)
    return await FormaPagamentoModel.buscarPorId(formaPagamentoId)
  }

  static async buscarFormaPagamentoPorId(id) {
    const formaPagamento = await FormaPagamentoModel.buscarPorId(id)
    if (!formaPagamento) {
      throw new Error("Forma de pagamento não encontrada")
    }
    return formaPagamento
  }

  static async listarFormasPagamento(incluirInativos = false) {
    return await FormaPagamentoModel.buscarTodos(incluirInativos)
  }

  static async atualizarFormaPagamento(id, dadosFormaPagamento) {
    const formaPagamentoExistente = await FormaPagamentoModel.buscarPorId(id)
    if (!formaPagamentoExistente) {
      throw new Error("Forma de pagamento não encontrada")
    }

    // Verificar se outro registro já usa este nome
    const formaPagamentoComMesmoNome = await FormaPagamentoModel.buscarPorNome(dadosFormaPagamento.nome)
    if (formaPagamentoComMesmoNome && formaPagamentoComMesmoNome.forma_pagamento_id !== Number.parseInt(id)) {
      throw new Error("Forma de pagamento com este nome já existe")
    }

    const sucesso = await FormaPagamentoModel.atualizar(id, dadosFormaPagamento)
    if (!sucesso) {
      throw new Error("Erro ao atualizar forma de pagamento")
    }

    return await FormaPagamentoModel.buscarPorId(id)
  }

  static async inativarFormaPagamento(id) {
    const formaPagamento = await FormaPagamentoModel.buscarPorId(id)
    if (!formaPagamento) {
      throw new Error("Forma de pagamento não encontrada")
    }

    const sucesso = await FormaPagamentoModel.inativar(id)
    if (!sucesso) {
      throw new Error("Erro ao inativar forma de pagamento")
    }

    return { message: "Forma de pagamento inativada com sucesso" }
  }
}

module.exports = FormaPagamentoService
