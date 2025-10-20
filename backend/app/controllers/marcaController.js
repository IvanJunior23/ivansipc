const marcaService = require("../services/marcaService")

console.log(" Controller: marcaService importado:", typeof marcaService)
console.log(" Controller: métodos disponíveis:", Object.keys(marcaService))

const list = async (req, res, next) => {
  try {
    console.log(" Controller: chamando getAllMarcas...")
    console.log(" Controller: tipo de getAllMarcas:", typeof marcaService.getAllMarcas)

    const marcas = await marcaService.getAllMarcas()
    res.json({ success: true, data: marcas })
  } catch (error) {
    console.error(" Controller: erro em list:", error)
    next(error)
  }
}

const create = async (req, res, next) => {
  try {
    // ✅ CORREÇÃO: Adicionar created_by do token de autenticação
    const marcaData = {
      ...req.body,
      created_by: req.user.id,
    }

    console.log("📝 Controller: dados para criar marca:", marcaData)
    console.log("📝 Controller: created_by extraído:", req.user.id)

    const result = await marcaService.createMarca(marcaData)
    res.status(201).json({ success: true, ...result, message: "Marca criada com sucesso" })
  } catch (error) {
    console.error("❌ Controller: erro ao criar marca:", error)
    res.status(400).json({ success: false, error: error.message })
  }
}

const update = async (req, res, next) => {
  try {
    // ✅ CORREÇÃO: Adicionar updated_by para updates
    const marcaData = {
      ...req.body,
      updated_by: req.user.id,
    }

    console.log("📝 Controller: dados para atualizar marca:", marcaData)
    console.log("📝 Controller: updated_by extraído:", req.user.id)

    const result = await marcaService.updateMarca(req.params.id, marcaData)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error("❌ Controller: erro ao atualizar marca:", error)
    res.status(400).json({ success: false, error: error.message })
  }
}

// Manter método antigo para compatibilidade
const remove = async (req, res, next) => {
  try {
    const result = await marcaService.deleteMarca(req.params.id)
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
    console.log("🔄 Controller: alterando status da marca ID:", id, "para:", status)
    console.log("🔄 Controller: dados recebidos no body:", req.body)

    // Validar se o parâmetro status foi fornecido
    if (status === undefined || status === null) {
      console.error("❌ Controller: parâmetro status não fornecido")
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "status" é obrigatório',
      })
    }

    // Validar se é um valor boolean válido
    if (typeof status !== "boolean" && status !== 0 && status !== 1 && status !== "0" && status !== "1") {
      console.error("❌ Controller: valor de status inválido:", status)
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "status" deve ser boolean, 0 ou 1',
      })
    }

    const marcaAtualizada = await marcaService.updateMarcaStatus(id, status)
    console.log("✅ Controller: status alterado com sucesso:", marcaAtualizada)
    res.json({ success: true, data: marcaAtualizada })
  } catch (error) {
    console.error("❌ Controller: erro ao alterar status:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor",
    })
  }
}

module.exports = { list, create, update, remove, toggleStatus }
