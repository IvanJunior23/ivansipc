// backend/app/services/enderecoService.js
const enderecoModel = require("../models/enderecoModel")

const getAllEnderecos = async () => {
  return await enderecoModel.findAll()
}

const createEndereco = async (addressData) => {
  return await enderecoModel.create(addressData)
}

const updateEndereco = async (id, addressData) => {
  const result = await enderecoModel.update(id, addressData)
  if (result.affectedRows === 0) throw new Error("Endereço não encontrado.")
  return { message: "Endereço atualizado com sucesso" }
}

// Manter método antigo para compatibilidade
const deleteEndereco = async (id) => {
  const result = await enderecoModel.remove(id)
  if (result.affectedRows === 0) throw new Error("Endereço não encontrado.")
  return { message: "Endereço inativado com sucesso" }
}

// Novo método específico para alteração de status
const updateEnderecoStatus = async (id, status) => {
  console.log('🔄 Service: alterando apenas status do endereço ID:', id, 'para:', status);
  
  // Verificar se o endereço existe
  const enderecos = await enderecoModel.findAll();
  const enderecoExiste = enderecos.find(e => e.endereco_id == id);
  
  if (!enderecoExiste) {
    throw new Error('Endereço não encontrado')
  }
  
  // Converter para boolean/int consistente
  const novoStatus = status === true || status === 1 || status === '1' ? 1 : 0;
  console.log('🔄 Service: convertendo status para:', novoStatus);
  
  // Fazer o update apenas do campo status
  const result = await enderecoModel.updateStatus(id, novoStatus);
  
  if (result.affectedRows === 0) {
    throw new Error('Endereço não encontrado')
  }
  
  // Retornar o endereço atualizado
  const enderecosAtualizados = await enderecoModel.findAll();
  const enderecoAtualizado = enderecosAtualizados.find(e => e.endereco_id == id);
  
  console.log('✅ Service: status alterado com sucesso:', enderecoAtualizado);
  return enderecoAtualizado;
}

module.exports = { 
  getAllEnderecos, 
  createEndereco, 
  updateEndereco, 
  deleteEndereco,
  updateEnderecoStatus  // Novo método
}
