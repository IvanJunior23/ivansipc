// backend/app/controllers/enderecoController.js
const enderecoService = require("../services/enderecoService")

const list = async (req, res, next) => {
  try {
    const enderecos = await enderecoService.getAllEnderecos()
    res.json({ success: true, data: enderecos })
  } catch (error) {
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    // ✅ CORREÇÃO: Adicionar created_by do token de autenticação
    const enderecoData = {
      ...req.body,
      created_by: req.user.id
    };
    
    console.log('📝 Controller: dados para criar endereço:', enderecoData);
    console.log('📝 Controller: created_by extraído:', req.user.id);
    
    const result = await enderecoService.createEndereco(enderecoData);
    res.status(201).json({ success: true, ...result, message: "Endereço criado com sucesso" });
  } catch (error) {
    console.error('❌ Controller: erro ao criar endereço:', error);
    res.status(400).json({ success: false, error: error.message });
  }
}

const update = async (req, res, next) => {
  try {
    // ✅ CORREÇÃO: Adicionar updated_by para updates
    const enderecoData = {
      ...req.body,
      updated_by: req.user.id
    };
    
    console.log('📝 Controller: dados para atualizar endereço:', enderecoData);
    console.log('📝 Controller: updated_by extraído:', req.user.id);
    
    const result = await enderecoService.updateEndereco(req.params.id, enderecoData);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ Controller: erro ao atualizar endereço:', error);
    res.status(400).json({ success: false, error: error.message });
  }
}

// Manter método antigo para compatibilidade
const remove = async (req, res, next) => {
  try {
    const result = await enderecoService.deleteEndereco(req.params.id)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(404).json({ success: false, error: error.message })
  }
}

// Novo método específico para alteração de status
const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    console.log('🔄 Controller: alterando status do endereço ID:', id, 'para:', status);
    console.log('🔄 Controller: dados recebidos no body:', req.body);
    
    // Validar se o parâmetro status foi fornecido
    if (status === undefined || status === null) {
      console.error('❌ Controller: parâmetro status não fornecido');
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "status" é obrigatório'
      })
    }
    
    // Validar se é um valor boolean válido
    if (typeof status !== 'boolean' && status !== 0 && status !== 1 && status !== '0' && status !== '1') {
      console.error('❌ Controller: valor de status inválido:', status);
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "status" deve ser boolean, 0 ou 1'
      })
    }
    
    const enderecoAtualizado = await enderecoService.updateEnderecoStatus(id, status)
    console.log('✅ Controller: status alterado com sucesso:', enderecoAtualizado);
    res.json({ success: true, data: enderecoAtualizado })
  } catch (error) {
    console.error('❌ Controller: erro ao alterar status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}

module.exports = { list, create, update, remove, toggleStatus }
