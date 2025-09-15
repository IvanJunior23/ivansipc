// backend/app/controllers/contatoController.js
const contatoService = require('../services/contatoService')

const list = async (req, res, next) => {
  try {
    console.log('🔍 Buscando todos os contatos do banco');
    
    // Buscar TODOS os contatos, não por usuário
    const contatos = await contatoService.getAllContatos()
    console.log('🔍 Total de contatos encontrados:', contatos.length);
    
    res.json({ success: true, data: contatos })
  } catch (error) {
    console.error('❌ Erro ao listar contatos:', error)
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    // Ainda podemos manter o created_by para auditoria
    const contatoData = {
      ...req.body,
      usuario_id: req.user?.id || null // Opcional agora
    }
    
    const novoContato = await contatoService.createContato(contatoData)
    res.status(201).json({ success: true, data: novoContato })
  } catch (error) {
    console.error('❌ Erro ao criar contato:', error)
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const { id } = req.params
    const contatoData = req.body
    
    const contatoAtualizado = await contatoService.updateContato(id, contatoData)
    res.json({ success: true, data: contatoAtualizado })
  } catch (error) {
    console.error('❌ Erro ao atualizar contato:', error)
    next(error)
  }
}

const remove = async (req, res, next) => {
  try {
    const { id } = req.params
    
    await contatoService.deleteContato(id)
    res.json({ success: true, message: 'Contato excluído com sucesso' })
  } catch (error) {
    console.error('❌ Erro ao excluir contato:', error)
    next(error)
  }
}
// No contatoController.js, o método toggleStatus deve estar assim:

const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { ativo } = req.body
    
    console.log('🔄 Controller: alterando status do contato ID:', id, 'para:', ativo);
    console.log('🔄 Controller: dados recebidos no body:', req.body);
    
    // Validar se o parâmetro ativo foi fornecido
    if (ativo === undefined || ativo === null) {
      console.error('❌ Controller: parâmetro ativo não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetro "ativo" é obrigatório' 
      })
    }
    
    // Validar se é um valor boolean válido
    if (typeof ativo !== 'boolean' && ativo !== 0 && ativo !== 1 && ativo !== '0' && ativo !== '1') {
      console.error('❌ Controller: valor de ativo inválido:', ativo);
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetro "ativo" deve ser boolean, 0 ou 1' 
      })
    }
    
    const contatoAtualizado = await contatoService.updateContatoStatus(id, ativo)
    
    console.log('✅ Controller: status alterado com sucesso:', contatoAtualizado);
    res.json({ success: true, data: contatoAtualizado })
    
  } catch (error) {
    console.error('❌ Controller: erro ao alterar status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}


module.exports = {
  list,
  create,
  update,
  remove,
  toggleStatus
}
