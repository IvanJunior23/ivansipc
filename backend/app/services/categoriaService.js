const categoriaModel = require("../models/categoriaModel")

const getAllCategorias = async () => {
  return await categoriaModel.findAll()
}

const createCategoria = async (categoryData) => {
  return await categoriaModel.create(categoryData)
}

const updateCategoria = async (id, categoryData) => {
  const result = await categoriaModel.update(id, categoryData)
  if (result.affectedRows === 0) throw new Error("Categoria não encontrada.")
  return { message: "Categoria atualizada com sucesso" }
}

// Manter método antigo para compatibilidade
const deleteCategoria = async (id) => {
  const result = await categoriaModel.remove(id)
  if (result.affectedRows === 0) throw new Error("Categoria não encontrada.")
  return { message: "Categoria inativada com sucesso" }
}

// Novo método específico para alteração de status
const updateCategoriaStatus = async (id, status) => {
  console.log("🔄 Service: alterando apenas status da categoria ID:", id, "para:", status)

  // Verificar se a categoria existe
  const categorias = await categoriaModel.findAll()
  const categoriaExiste = categorias.find((c) => c.categoria_id == id)

  if (!categoriaExiste) {
    throw new Error("Categoria não encontrada")
  }

  // Converter para boolean/int consistente
  const novoStatus = status === true || status === 1 || status === "1" ? 1 : 0
  console.log("🔄 Service: convertendo status para:", novoStatus)

  // Fazer o update apenas do campo status
  const result = await categoriaModel.updateStatus(id, novoStatus)

  if (result.affectedRows === 0) {
    throw new Error("Categoria não encontrada")
  }

  // Retornar a categoria atualizada
  const categoriasAtualizadas = await categoriaModel.findAll()
  const categoriaAtualizada = categoriasAtualizadas.find((c) => c.categoria_id == id)

  console.log("✅ Service: status alterado com sucesso:", categoriaAtualizada)
  return categoriaAtualizada
}

module.exports = {
  getAllCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  updateCategoriaStatus, // Novo método
}
