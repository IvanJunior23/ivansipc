// backend/app/services/contatoService.js
const contatoModel = require('../models/contatoModel')

// Buscar TODOS os contatos (sem filtro de usuário)
const getAllContatos = async () => {
  console.log('🔍 Service: buscando todos os contatos');
  const result = await contatoModel.findAll(); // Usar findAll em vez de findByUserId
  console.log('🔍 Service: encontrados', result.length, 'contatos');
  return result;
}

const createContato = async (contatoData) => {
  // Validações básicas
  if (!contatoData.nome_completo) {
    throw new Error('Nome é obrigatório')
  }
  if (!contatoData.telefone) {
    throw new Error('Telefone é obrigatório')
  }
  
  console.log('➕ Service: criando contato com dados:', contatoData);
  const result = await contatoModel.create(contatoData);
  console.log('✅ Service: contato criado com sucesso');
  return result;
}

const updateContato = async (id, contatoData) => {
  console.log('🔄 Service: atualizando contato ID:', id, 'com dados:', contatoData);
  
  // Verificar se o contato existe
  const contatos = await contatoModel.findAll();
  const contatoExiste = contatos.find(c => c.contato_id == id);
  
  if (!contatoExiste) {
    throw new Error('Contato não encontrado')
  }

  // Se só está alterando o status, usar método específico
  if (Object.keys(contatoData).length === 1 && contatoData.hasOwnProperty('ativo')) {
    console.log('🔄 Service: detectado update apenas de status');
    return await updateContatoStatus(id, contatoData.ativo);
  }

  console.log('🔄 Service: fazendo update completo do contato');
  await contatoModel.update(id, contatoData);
  
  // Retornar o contato atualizado
  const contatosAtualizados = await contatoModel.findAll();
  const contatoAtualizado = contatosAtualizados.find(c => c.contato_id == id);
  
  console.log('✅ Service: contato atualizado com sucesso:', contatoAtualizado);
  return contatoAtualizado;
}

// Método específico para alterar apenas o status
const updateContatoStatus = async (id, ativo) => {
  console.log('🔄 Service: alterando apenas status do contato ID:', id, 'para:', ativo);
  
  // Verificar se o contato existe
  const contatos = await contatoModel.findAll();
  const contatoExiste = contatos.find(c => c.contato_id == id);
  
  if (!contatoExiste) {
    throw new Error('Contato não encontrado')
  }
  
  // Converter para boolean/int consistente
  const novoStatus = ativo === true || ativo === 1 || ativo === '1' ? 1 : 0;
  console.log('🔄 Service: convertendo status para:', novoStatus);
  
  // Fazer o update apenas do campo ativo
  await contatoModel.update(id, { ativo: novoStatus });
  
  // Retornar o contato atualizado
  const contatosAtualizados = await contatoModel.findAll();
  const contatoAtualizado = contatosAtualizados.find(c => c.contato_id == id);
  
  console.log('✅ Service: status alterado com sucesso:', contatoAtualizado);
  return contatoAtualizado;
}

// Buscar contato por ID (útil para validações futuras)
const getContatoById = async (id) => {
  console.log('🔍 Service: buscando contato por ID:', id);
  const contatos = await contatoModel.findAll();
  const contato = contatos.find(c => c.contato_id == id);
  
  console.log('🔍 Service: contato encontrado:', contato ? 'sim' : 'não');
  return contato || null;
}

module.exports = {
  getAllContatos,
  createContato,
  updateContato,
  updateContatoStatus,  // Novo método específico para status
  getContatoById        // Método auxiliar
}
