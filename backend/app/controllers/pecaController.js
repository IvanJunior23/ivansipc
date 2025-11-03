const pecaService = require("../services/pecaService")

const list = async (req, res, next) => {
  try {
    const incluirInativos = req.query.incluirInativos === "true"
    const pecas = incluirInativos ? await pecaService.listarPecas(true) : await pecaService.getAllPecas()

    res.json({ success: true, data: pecas })
  } catch (error) {
    console.error("Erro ao listar peças:", error)
    res.status(500).json({
      success: false,
      message: "Ocorreu um erro interno no servidor.",
      error: error.message,
    })
  }
}

const getById = async (req, res, next) => {
  try {
    const { id } = req.params
    const peca = await pecaService.buscarPecaPorId(id)
    res.json({ success: true, data: peca })
  } catch (error) {
    if (error.message === "Peça não encontrada") {
      res.status(404).json({ success: false, error: error.message })
    } else {
      res.status(500).json({
        success: false,
        message: "Ocorreu um erro interno no servidor.",
        error: error.message,
      })
    }
  }
}

const create = async (req, res, next) => {
  try {
    console.log(" Controller: create chamado")
    console.log(" Controller: req.user:", req.user)
    console.log(" Controller: req.body:", req.body)

    if (!req.user || !req.user.id) {
      console.log(" Controller: usuário não autenticado")
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      })
    }

    const requiredFields = ["nome", "preco_venda", "preco_compra", "estoque_minimo"]
    const missingFields = []

    // Check for missing required fields
    requiredFields.forEach((field) => {
      if (!req.body[field] || req.body[field] === "" || req.body[field] === null || req.body[field] === undefined) {
        switch (field) {
          case "nome":
            missingFields.push("Nome da peça é obrigatório")
            break
          case "preco_venda":
            missingFields.push("Preço de venda é obrigatório")
            break
          case "preco_compra":
            missingFields.push("Preço de custo é obrigatório")
            break
          case "estoque_minimo":
            missingFields.push("Quantidade mínima é obrigatória")
            break
        }
      }
    })

    console.log(" Controller: campos faltando:", missingFields)

    if (missingFields.length > 0) {
      console.log("Controller: validação falhou, retornando erro 400")
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: missingFields,
      })
    }

    const pecaData = {
      ...req.body,
      created_by: req.user.id,
    }

    console.log(" Controller: chamando pecaService.criarPeca com dados:", pecaData)

    const result = await pecaService.criarPeca(pecaData)

    console.log(" Controller: peça criada com sucesso, result:", result)

    res.status(201).json({ success: true, data: result, message: "Peça criada com sucesso" })
  } catch (error) {
    console.error(" Controller: erro ao criar peça:", error)
    res.status(400).json({ success: false, error: error.message })
  }
}

const update = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      })
    }

    const pecaData = {
      ...req.body,
      updated_by: req.user.id,
    }

    const result = await pecaService.atualizarPeca(req.params.id, pecaData)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}

const remove = async (req, res, next) => {
  try {
    const result = await pecaService.inativarPeca(req.params.id)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(404).json({ success: false, error: error.message })
  }
}

const toggleStatus = async (req, res, next) => {
  try {
    console.log(" Controller: toggleStatus chamado")
    console.log(" Controller: req.params:", req.params)
    console.log(" Controller: req.body:", req.body)

    const { id } = req.params
    const { status } = req.body

    let statusValue
    if (status === "ativo" || status === true || status === 1 || status === "1") {
      statusValue = true
    } else if (status === "inativo" || status === false || status === 0 || status === "0") {
      statusValue = false
    } else {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "status" deve ser "ativo", "inativo", boolean, 0 ou 1',
      })
    }

    console.log(" Controller: statusValue convertido:", statusValue)
    const pecaAtualizada = await pecaService.toggleStatusWithValue(id, statusValue)
    console.log(" Controller: peça atualizada:", pecaAtualizada)

    res.json({ success: true, data: pecaAtualizada })
  } catch (error) {
    console.error(" Controller: erro ao alternar status:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor",
    })
  }
}

const vincularImagem = async (req, res, next) => {
  try {
    const { id } = req.params
    const { imagem_id } = req.body

    if (!imagem_id) {
      return res.status(400).json({
        success: false,
        error: "imagem_id é obrigatório",
      })
    }

    const result = await pecaService.vincularImagemPeca(id, imagem_id)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}

const buscarImagens = async (req, res, next) => {
  try {
    const { id } = req.params
    const imagens = await pecaService.buscarImagensPeca(id)
    res.json({ success: true, data: imagens })
  } catch (error) {
    res.status(404).json({ success: false, error: error.message })
  }
}

const removerImagem = async (req, res, next) => {
  try {
    const { id, imagemId } = req.params
    const result = await pecaService.removerImagemPeca(id, imagemId)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}

const gerarCodigo = async (req, res, next) => {
  try {
    const { categoria_id, marca_id } = req.query
    const codigo = await pecaService.gerarCodigoAutomatico(categoria_id, marca_id)
    res.json({ success: true, data: { codigo } })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao gerar código",
    })
  }
}

const getByFornecedor = async (req, res, next) => {
  try {
    const { fornecedorId } = req.params
    const pecas = await pecaService.buscarPecasPorFornecedor(fornecedorId)
    res.json({ success: true, data: pecas })
  } catch (error) {
    console.error("Erro ao buscar peças por fornecedor:", error)
    res.status(500).json({
      success: false,
      message: "Erro ao buscar peças por fornecedor",
      error: error.message,
    })
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  toggleStatus,
  vincularImagem,
  buscarImagens,
  removerImagem,
  gerarCodigo,
  getByFornecedor, // Export new method
}
