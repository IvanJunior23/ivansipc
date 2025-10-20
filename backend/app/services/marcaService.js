const marcaModel = require("../models/marcaModel")

console.log(" Service: marcaModel importado:", typeof marcaModel)
console.log(" Service: métodos disponíveis:", Object.keys(marcaModel))

const getAllMarcas = async () => {
  console.log(" Service: getAllMarcas chamado")
  return await marcaModel.findAll()
}

const createMarca = async (marcaData) => {
  console.log(" Service: createMarca chamado")
  return await marcaModel.create(marcaData)
}

const updateMarca = async (id, marcaData) => {
  console.log(" Service: updateMarca chamado")
  const result = await marcaModel.update(id, marcaData)
  if (result.affectedRows === 0) throw new Error("Marca não encontrada.")
  return { message: "Marca atualizada com sucesso" }
}

// Manter método antigo para compatibilidade
const deleteMarca = async (id) => {
  console.log(" Service: deleteMarca chamado")
  const result = await marcaModel.remove(id)
  if (result.affectedRows === 0) throw new Error("Marca não encontrada.")
  return { message: "Marca inativada com sucesso" }
}

// Novo método específico para alteração de status
const updateMarcaStatus = async (id, status) => {
  console.log("🔄 Service: alterando apenas status da marca ID:", id, "para:", status)

  // Verificar se a marca existe
  const marcas = await marcaModel.findAll()
  const marcaExiste = marcas.find((m) => m.marca_id == id)

  if (!marcaExiste) {
    throw new Error("Marca não encontrada")
  }

  // Converter para boolean/int consistente
  const novoStatus = status === true || status === 1 || status === "1" ? 1 : 0
  console.log("🔄 Service: convertendo status para:", novoStatus)

  // Fazer o update apenas do campo status
  const result = await marcaModel.updateStatus(id, novoStatus)

  if (result.affectedRows === 0) {
    throw new Error("Marca não encontrada")
  }

  // Retornar a marca atualizada
  const marcasAtualizadas = await marcaModel.findAll()
  const marcaAtualizada = marcasAtualizadas.find((m) => m.marca_id == id)

  console.log("✅ Service: status alterado com sucesso:", marcaAtualizada)
  return marcaAtualizada
}

module.exports = {
  getAllMarcas,
  createMarca,
  updateMarca,
  deleteMarca,
  updateMarcaStatus, // Novo método
}
