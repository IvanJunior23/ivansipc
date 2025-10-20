const imagemModel = require("../models/imagemModel")
const fs = require("fs")
const path = require("path")

const getAllImagens = async (incluirInativos = false) => {
  return await imagemModel.buscarTodos(incluirInativos)
}

const getImagemById = async (id) => {
  return await imagemModel.buscarPorId(id)
}

const createMultipleImagens = async (imagensData) => {
  const results = []

  for (const imagemData of imagensData) {
    try {
      const imagemId = await imagemModel.criar(imagemData)
      results.push({
        id: imagemId,
        referencia_url: imagemData.referencia_url,
        descricao: imagemData.descricao,
        status: "success",
      })
    } catch (error) {
      console.error("❌ Service: erro ao criar imagem:", error)
      results.push({
        referencia_url: imagemData.referencia_url,
        descricao: imagemData.descricao,
        status: "error",
        error: error.message,
      })
    }
  }

  return results
}

const updateImagem = async (id, imagemData) => {
  const result = await imagemModel.atualizar(id, imagemData)
  if (!result) throw new Error("Imagem não encontrada.")
  return { message: "Imagem atualizada com sucesso" }
}

const deleteImagem = async (id) => {
  // Buscar a imagem para obter o caminho do arquivo
  const imagem = await imagemModel.buscarPorId(id)
  if (!imagem) {
    throw new Error("Imagem não encontrada")
  }

  // Tentar deletar o arquivo físico
  try {
    const filePath = path.join(__dirname, "../../../uploads/images", path.basename(imagem.referencia_url))
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log("✅ Service: arquivo físico deletado:", filePath)
    }
  } catch (error) {
    console.warn("⚠️ Service: erro ao deletar arquivo físico:", error.message)
  }

  // Deletar registro do banco
  const result = await imagemModel.deletar(id)
  if (!result) throw new Error("Imagem não encontrada.")
  return { message: "Imagem deletada com sucesso" }
}

const updateImagemStatus = async (id, status) => {
  console.log("🔄 Service: alterando status da imagem ID:", id, "para:", status)

  // Verificar se a imagem existe
  const imagem = await imagemModel.buscarPorId(id)
  if (!imagem) {
    throw new Error("Imagem não encontrada")
  }

  // Converter para boolean/int consistente
  const novoStatus = status === true || status === 1 || status === "1" ? 1 : 0
  console.log("🔄 Service: convertendo status para:", novoStatus)

  // Fazer o update apenas do campo status
  const imagemAtualizada = {
    ...imagem,
    status: novoStatus,
  }

  const result = await imagemModel.atualizar(id, imagemAtualizada)
  if (!result) {
    throw new Error("Imagem não encontrada")
  }

  // Retornar a imagem atualizada
  const imagemFinal = await imagemModel.buscarPorId(id)
  console.log("✅ Service: status alterado com sucesso:", imagemFinal)
  return imagemFinal
}

module.exports = {
  getAllImagens,
  getImagemById,
  createMultipleImagens,
  updateImagem,
  deleteImagem,
  updateImagemStatus,
}
