const imagemService = require("../services/imagemService")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../../uploads/images")
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    cb(null, "img-" + uniqueSuffix + extension)
  },
})

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos (JPEG, JPG, PNG, GIF, WEBP)"))
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por arquivo
  },
  fileFilter: fileFilter,
})

const list = async (req, res, next) => {
  try {
    const incluirInativos = req.query.incluir_inativos === "true"
    const imagens = await imagemService.getAllImagens(incluirInativos)
    res.json({ success: true, data: imagens })
  } catch (error) {
    next(error)
  }
}

const getById = async (req, res, next) => {
  try {
    const imagem = await imagemService.getImagemById(req.params.id)
    if (!imagem) {
      return res.status(404).json({ success: false, error: "Imagem não encontrada" })
    }
    res.json({ success: true, data: imagem })
  } catch (error) {
    next(error)
  }
}

const uploadMultiple = async (req, res, next) => {
  try {
    upload.array("imagens", 10)(req, res, async (err) => {
      if (err) {
        console.error("❌ Controller: erro no upload:", err)
        return res.status(400).json({ success: false, error: err.message })
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: "Nenhuma imagem foi enviada" })
      }

      console.log("📁 Controller: arquivos recebidos:", req.files.length)

      const descricao = req.body.descricao || ""

      const imagensData = req.files.map((file, index) => ({
        referencia_url: `/uploads/images/${file.filename}`,
        descricao: descricao || `Imagem ${file.originalname}`,
        status: true,
        created_by: req.user.id,
      }))

      const result = await imagemService.createMultipleImagens(imagensData)
      res.status(201).json({
        success: true,
        data: result,
        message: `${req.files.length} imagem(ns) enviada(s) com sucesso`,
      })
    })
  } catch (error) {
    console.error("❌ Controller: erro ao fazer upload:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}

const update = async (req, res, next) => {
  try {
    const imagemData = {
      ...req.body,
      updated_by: req.user.id,
    }

    console.log("📝 Controller: dados para atualizar imagem:", imagemData)

    const result = await imagemService.updateImagem(req.params.id, imagemData)
    res.json({ success: true, ...result })
  } catch (error) {
    console.error("❌ Controller: erro ao atualizar imagem:", error)
    res.status(400).json({ success: false, error: error.message })
  }
}

const remove = async (req, res, next) => {
  try {
    const result = await imagemService.deleteImagem(req.params.id)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(404).json({ success: false, error: error.message })
  }
}

const toggleStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    console.log("🔄 Controller: alterando status da imagem ID:", id, "para:", status)

    if (status === undefined || status === null) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "status" é obrigatório',
      })
    }

    if (typeof status !== "boolean" && status !== 0 && status !== 1 && status !== "0" && status !== "1") {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro "status" deve ser boolean, 0 ou 1',
      })
    }

    const imagemAtualizada = await imagemService.updateImagemStatus(id, status)
    res.json({ success: true, data: imagemAtualizada })
  } catch (error) {
    console.error("❌ Controller: erro ao alterar status:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Erro interno do servidor",
    })
  }
}

// Rota para servir imagens
const serveImage = async (req, res, next) => {
  try {
    const filename = req.params.filename
    const imagePath = path.join(__dirname, "../../../uploads/images", filename)

    // Verificar se o arquivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, error: "Imagem não encontrada" })
    }

    // Servir o arquivo
    res.sendFile(imagePath)
  } catch (error) {
    console.error("❌ Controller: erro ao servir imagem:", error)
    res.status(500).json({ success: false, error: "Erro ao carregar imagem" })
  }
}

module.exports = {
  list,
  getById,
  uploadMultiple,
  update,
  remove,
  toggleStatus,
  serveImage,
}
