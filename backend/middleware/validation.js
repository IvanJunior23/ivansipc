// backend/middleware/validation.js
const validator = require("validator")

const FIELD_LIMITS = {
  email: 255,
  senha: 255,

  // Pessoa
  nome: 150,

  // Contato
  nome_completo: 150,
  telefone: 20,
  email_contato: 150,

  // Endereco
  logradouro: 255,
  numero: 20,
  complemento: 100,
  bairro: 100,
  cidade: 100,
  estado: 2,
  cep: 9,

  // Categoria
  categoria_nome: 100,
  categoria_descricao: 65535,
  // Marca
  marca_nome: 100,
  marca_descricao: 65535,

  // Forma_pagamento
  forma_pagamento_nome: 100,
  forma_pagamento_descricao: 65535,

  // Peca
  nome: 255,
  descricao: 65535,
  imagem_url: 500,
}

const sanitizeInput = (value) => {
  if (typeof value !== "string") return value
  return validator.escape(value.trim())
}

const sanitizeObject = (obj) => {
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

const validateFieldLength = (fieldName, value, customLimit = null) => {
  if (typeof value !== "string") return null

  const limit = customLimit || FIELD_LIMITS[fieldName]
  if (!limit) return null

  if (value.length > limit) {
    return `${fieldName} deve ter no máximo ${limit} caracteres`
  }
  return null
}

const validateEmail = (email) => {
  const errors = []

  if (!email || !email.trim()) {
    errors.push("E-mail é obrigatório")
    return errors
  }

  const trimmedEmail = email.trim()

  if (!validator.isEmail(trimmedEmail)) {
    errors.push("Formato de e-mail inválido")
  }

  const lengthError = validateFieldLength("email", trimmedEmail)
  if (lengthError) errors.push(lengthError)

  return errors
}

const validatePassword = (senha, confirmarSenha = null) => {
  const errors = []

  if (!senha || !senha.trim()) {
    errors.push("Senha é obrigatória")
    return errors
  }

  const trimmedSenha = senha.trim()

  if (trimmedSenha.length < 6) {
    errors.push("Senha deve ter pelo menos 6 caracteres")
  }

  if (trimmedSenha.length > 255) {
    errors.push("Senha deve ter no máximo 255 caracteres")
  }

  if (confirmarSenha !== null && trimmedSenha !== confirmarSenha.trim()) {
    errors.push("Confirmação de senha não confere")
  }

  return errors
}

const validateUserCreation = (req, res, next) => {
  const errors = []
  const { pessoa_id, email, confirmarEmail, senha, confirmarSenha, tipo_usuario } = req.body

  req.body = sanitizeObject(req.body)

  if (!pessoa_id) {
    errors.push("Pessoa é obrigatória")
  } else if (isNaN(pessoa_id) || pessoa_id <= 0) {
    errors.push("Pessoa deve ser um ID válido")
  }

  const emailErrors = validateEmail(email)
  errors.push(...emailErrors)

  if (confirmarEmail !== undefined) {
    if (!confirmarEmail || !confirmarEmail.trim()) {
      errors.push("Confirmação de e-mail é obrigatória")
    } else if (email && email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()) {
      errors.push("Confirmação de e-mail não confere")
    }
  }

  const passwordErrors = validatePassword(senha, confirmarSenha)
  errors.push(...passwordErrors)

  if (!tipo_usuario || !["admin", "vendedor", "estoque"].includes(tipo_usuario)) {
    errors.push("Tipo de usuário deve ser: admin, vendedor ou estoque")
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validateUserUpdate = (req, res, next) => {
  const errors = []
  const { pessoa_id, email, confirmarEmail, senha, confirmarSenha, tipo_usuario } = req.body

  req.body = sanitizeObject(req.body)

  if (pessoa_id !== undefined) {
    if (!pessoa_id) {
      errors.push("Pessoa não pode estar vazia")
    } else if (isNaN(pessoa_id) || pessoa_id <= 0) {
      errors.push("Pessoa deve ser um ID válido")
    }
  }

  if (email !== undefined) {
    const emailErrors = validateEmail(email)
    errors.push(...emailErrors)

    if (confirmarEmail !== undefined) {
      if (!confirmarEmail || !confirmarEmail.trim()) {
        errors.push("Confirmação de e-mail é obrigatória quando alterando e-mail")
      } else if (email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()) {
        errors.push("Confirmação de e-mail não confere")
      }
    }
  }

  if (senha !== undefined && senha.trim()) {
    const passwordErrors = validatePassword(senha, confirmarSenha)
    errors.push(...passwordErrors)
  }

  if (tipo_usuario !== undefined && !["admin", "vendedor", "estoque"].includes(tipo_usuario)) {
    errors.push("Tipo de usuário deve ser: admin, vendedor ou estoque")
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validateContact = (req, res, next) => {
  const errors = []
  const { nome_completo, telefone, email } = req.body

  req.body = sanitizeObject(req.body)

  if (!nome_completo || !nome_completo.trim()) {
    errors.push("Nome completo é obrigatório")
  } else {
    const lengthError = validateFieldLength("nome_completo", nome_completo.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (!telefone || !telefone.trim()) {
    errors.push("Telefone é obrigatório")
  } else {
    const lengthError = validateFieldLength("telefone", telefone.trim())
    if (lengthError) errors.push(lengthError)

    const phoneRegex = /^[\d\s\-$$$$+]+$/
    if (!phoneRegex.test(telefone.trim())) {
      errors.push("Formato de telefone inválido")
    }
  }

  if (email && email.trim()) {
    const emailErrors = validateEmail(email)
    errors.push(...emailErrors)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validatePessoa = (req, res, next) => {
  const { nome, status } = req.body
  const errors = []

  if (!nome || nome.trim().length === 0) {
    errors.push({ field: "nome", message: "Nome é obrigatório" })
  } else if (nome.trim().length < 2) {
    errors.push({ field: "nome", message: "Nome deve ter pelo menos 2 caracteres" })
  } else if (nome.trim().length > 255) {
    errors.push({ field: "nome", message: "Nome deve ter no máximo 255 caracteres" })
  } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome.trim())) {
    errors.push({ field: "nome", message: "Nome deve conter apenas letras e espaços" })
  }

  if (status && !["ativo", "inativo"].includes(status)) {
    errors.push({ field: "status", message: 'Status deve ser "ativo" ou "inativo"' })
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: errors,
    })
  }

  next()
}

const validateAddress = (req, res, next) => {
  const errors = []
  const { logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body

  req.body = sanitizeObject(req.body)

  const requiredFields = [
    { field: "logradouro", name: "Logradouro" },
    { field: "numero", name: "Número" },
    { field: "bairro", name: "Bairro" },
    { field: "cidade", name: "Cidade" },
    { field: "estado", name: "Estado" },
    { field: "cep", name: "CEP" },
  ]

  requiredFields.forEach(({ field, name }) => {
    const value = req.body[field]
    if (!value || !value.trim()) {
      errors.push(`${name} é obrigatório`)
    } else {
      const lengthError = validateFieldLength(field, value.trim())
      if (lengthError) errors.push(lengthError)
    }
  })

  if (estado && estado.trim() && estado.trim().length !== 2) {
    errors.push("Estado deve ter exatamente 2 caracteres")
  }

  // Validate CEP
  if (cep && cep.trim()) {
    const cepRegex = /^\d{5}-?\d{3}$/
    if (!cepRegex.test(cep.trim())) {
      errors.push("Formato de CEP inválido (use: 12345-678 ou 12345678)")
    }
  }

  if (complemento && complemento.trim()) {
    const lengthError = validateFieldLength("complemento", complemento.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarCategoria = (req, res, next) => {
  const errors = []
  const { nome, descricao } = req.body

  req.body = sanitizeObject(req.body)

  if (!nome || !nome.trim()) {
    errors.push("Nome da categoria é obrigatório")
  } else {
    const lengthError = validateFieldLength("categoria_nome", nome.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (descricao && descricao.trim()) {
    const lengthError = validateFieldLength("categoria_descricao", descricao.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarMarca = (req, res, next) => {
  const errors = []
  const { nome, descricao } = req.body

  req.body = sanitizeObject(req.body)

  if (!nome || !nome.trim()) {
    errors.push("Nome da marca é obrigatório")
  } else {
    const lengthError = validateFieldLength("marca_nome", nome.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (descricao && descricao.trim()) {
    const lengthError = validateFieldLength("marca_descricao", descricao.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarFormaPagamento = (req, res, next) => {
  const errors = []
  const { nome, descricao } = req.body

  req.body = sanitizeObject(req.body)

  if (!nome || !nome.trim()) {
    errors.push("Nome da forma de pagamento é obrigatório")
  } else {
    const lengthError = validateFieldLength("forma_pagamento_nome", nome.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (descricao && descricao.trim()) {
    const lengthError = validateFieldLength("forma_pagamento_descricao", descricao.trim())
    if (lengthError) errors.push(lengthError)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarPeca = (req, res, next) => {
  const errors = []
  const {
    nome,
    descricao,
    marca_id,
    preco_venda,
    preco_compra,
    quantidade_estoque,
    estoque_minimo,
    categoria_id,
    condicao,
  } = req.body

  req.body = sanitizeObject(req.body)

  if (!nome || !nome.trim()) {
    errors.push("Nome da peça é obrigatório")
  } else {
    const lengthError = validateFieldLength("nome", nome.trim(), 255)
    if (lengthError) errors.push(lengthError)
  }

  if (descricao && descricao.trim()) {
    const lengthError = validateFieldLength("descricao", descricao.trim(), 65535)
    if (lengthError) errors.push(lengthError)
  }

  if (marca_id !== undefined && marca_id !== null && marca_id !== "") {
    if (!Number.isInteger(Number(marca_id)) || Number(marca_id) <= 0) {
      errors.push("ID da marca deve ser um número inteiro positivo")
    }
  }

  if (categoria_id !== undefined && categoria_id !== null && categoria_id !== "") {
    if (!Number.isInteger(Number(categoria_id)) || Number(categoria_id) <= 0) {
      errors.push("ID da categoria deve ser um número inteiro positivo")
    }
  }

  if (preco_venda === undefined || preco_venda === null || preco_venda === "") {
    errors.push("Preço de venda é obrigatório")
  } else {
    const preco = Number.parseFloat(preco_venda)
    if (isNaN(preco) || preco < 0) {
      errors.push("Preço de venda deve ser um número positivo")
    }
    if (preco > 99999999.99) {
      errors.push("Preço de venda deve ser menor que R$ 99.999.999,99")
    }
  }

  if (preco_compra === undefined || preco_compra === null || preco_compra === "") {
    errors.push("Preço de compra é obrigatório")
  } else {
    const preco = Number.parseFloat(preco_compra)
    if (isNaN(preco) || preco < 0) {
      errors.push("Preço de compra deve ser um número positivo")
    }
    if (preco > 99999999.99) {
      errors.push("Preço de compra deve ser menor que R$ 99.999.999,99")
    }
  }

  if (quantidade_estoque !== undefined && quantidade_estoque !== null && quantidade_estoque !== "") {
    if (!Number.isInteger(Number(quantidade_estoque)) || Number(quantidade_estoque) < 0) {
      errors.push("Quantidade em estoque deve ser um número inteiro não negativo")
    }
  }

  if (estoque_minimo === undefined || estoque_minimo === null || estoque_minimo === "") {
    errors.push("Estoque mínimo é obrigatório")
  } else {
    if (!Number.isInteger(Number(estoque_minimo)) || Number(estoque_minimo) < 0) {
      errors.push("Estoque mínimo deve ser um número inteiro não negativo")
    }
  }

  if (condicao !== undefined && condicao !== null && condicao !== "") {
    if (!["novo", "usado", "recondicionado"].includes(condicao)) {
      errors.push("Condição deve ser 'novo', 'usado' ou 'recondicionado'")
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarImagemPeca = (req, res, next) => {
  const errors = []
  const { imagem_url, descricao } = req.body

  req.body = sanitizeObject(req.body)

  if (!imagem_url || !imagem_url.trim()) {
    errors.push("URL da imagem é obrigatória")
  } else {
    const lengthError = validateFieldLength("imagem_url", imagem_url.trim(), 500)
    if (lengthError) errors.push(lengthError)

    try {
      new URL(imagem_url.trim())
    } catch {
      errors.push("URL da imagem deve ser uma URL válida")
    }
  }

  if (descricao && descricao.trim()) {
    const lengthError = validateFieldLength("descricao", descricao.trim(), 255)
    if (lengthError) errors.push(lengthError)
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validateCpf = (cpf) => {
  if (!cpf || !cpf.trim()) {
    return "CPF é obrigatório"
  }

  const cleanCpf = cpf.replace(/\D/g, "")

  if (cleanCpf.length !== 11) {
    return "CPF deve ter 11 dígitos"
  }

  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return "CPF inválido"
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleanCpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(cleanCpf.charAt(9))) {
    return "CPF inválido"
  }

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleanCpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(cleanCpf.charAt(10))) {
    return "CPF inválido"
  }

  return null
}

const validateCnpj = (cnpj) => {
  if (!cnpj || !cnpj.trim()) {
    return "CNPJ é obrigatório"
  }

  const cleanCnpj = cnpj.replace(/\D/g, "")

  if (cleanCnpj.length !== 14) {
    return "CNPJ deve ter 14 dígitos"
  }

  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return "CNPJ inválido"
  }

  let length = cleanCnpj.length - 2
  let numbers = cleanCnpj.substring(0, length)
  const digits = cleanCnpj.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number.parseInt(digits.charAt(0))) {
    return "CNPJ inválido"
  }

  length = length + 1
  numbers = cleanCnpj.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number.parseInt(digits.charAt(1))) {
    return "CNPJ inválido"
  }

  return null
}

const validarCliente = (req, res, next) => {
  const errors = []
  const { pessoa_id, cpf } = req.body

  req.body = sanitizeObject(req.body)

  // Validar pessoa_id
  if (!pessoa_id) {
    errors.push("ID da pessoa é obrigatório")
  } else {
    if (!Number.isInteger(Number(pessoa_id)) || Number(pessoa_id) <= 0) {
      errors.push("ID da pessoa deve ser um número inteiro positivo")
    }
  }

  // Validar CPF
  const cpfError = validateCpf(cpf)
  if (cpfError) errors.push(cpfError)

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarFornecedor = (req, res, next) => {
  const errors = []
  const { pessoa_id, cnpj } = req.body

  req.body = sanitizeObject(req.body)

  // Validar pessoa_id
  if (!pessoa_id) {
    errors.push("ID da pessoa é obrigatório")
  } else {
    if (!Number.isInteger(Number(pessoa_id)) || Number(pessoa_id) <= 0) {
      errors.push("ID da pessoa deve ser um número inteiro positivo")
    }
  }

  // Validar CNPJ
  const cnpjError = validateCnpj(cnpj)
  if (cnpjError) errors.push(cnpjError)

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarCompra = (req, res, next) => {
  const errors = []
  const { fornecedor_id, data_compra, itens } = req.body

  req.body = sanitizeObject(req.body)

  if (!fornecedor_id) {
    errors.push("ID do fornecedor é obrigatório")
  } else {
    if (!Number.isInteger(Number(fornecedor_id)) || Number(fornecedor_id) <= 0) {
      errors.push("ID do fornecedor deve ser um número inteiro positivo")
    }
  }

  if (data_compra && data_compra.trim()) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data_compra.trim())) {
      errors.push("Data da compra deve estar no formato YYYY-MM-DD")
    } else {
      const date = new Date(data_compra.trim())
      if (isNaN(date.getTime())) {
        errors.push("Data da compra inválida")
      }
    }
  }

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    errors.push("Compra deve ter pelo menos um item")
  } else {
    itens.forEach((item, index) => {
      if (!item.peca_id) {
        errors.push(`Item ${index + 1}: ID da peça é obrigatório`)
      } else {
        if (!Number.isInteger(Number(item.peca_id)) || Number(item.peca_id) <= 0) {
          errors.push(`Item ${index + 1}: ID da peça deve ser um número inteiro positivo`)
        }
      }

      if (!item.quantidade) {
        errors.push(`Item ${index + 1}: Quantidade é obrigatória`)
      } else {
        if (!Number.isInteger(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
          errors.push(`Item ${index + 1}: Quantidade deve ser um número inteiro positivo`)
        }
      }

      if (item.valor_unitario === undefined || item.valor_unitario === null || item.valor_unitario === "") {
        errors.push(`Item ${index + 1}: Valor unitário é obrigatório`)
      } else {
        const valor = Number.parseFloat(item.valor_unitario)
        if (isNaN(valor) || valor <= 0) {
          errors.push(`Item ${index + 1}: Valor unitário deve ser um número positivo`)
        }
        if (valor > 99999999.99) {
          errors.push(`Item ${index + 1}: Valor unitário deve ser menor que R$ 99.999.999,99`)
        }
      }
    })
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarVenda = (req, res, next) => {
  const errors = []
  const { cliente_id, data_venda, forma_pagamento_id, itens } = req.body

  req.body = sanitizeObject(req.body)

  if (!cliente_id) {
    errors.push("ID do cliente é obrigatório")
  } else {
    if (!Number.isInteger(Number(cliente_id)) || Number(cliente_id) <= 0) {
      errors.push("ID do cliente deve ser um número inteiro positivo")
    }
  }

  if (!forma_pagamento_id) {
    errors.push("ID da forma de pagamento é obrigatório")
  } else {
    if (!Number.isInteger(Number(forma_pagamento_id)) || Number(forma_pagamento_id) <= 0) {
      errors.push("ID da forma de pagamento deve ser um número inteiro positivo")
    }
  }

  if (data_venda && data_venda.trim()) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data_venda.trim())) {
      errors.push("Data da venda deve estar no formato YYYY-MM-DD")
    } else {
      const date = new Date(data_venda.trim())
      if (isNaN(date.getTime())) {
        errors.push("Data da venda inválida")
      }
    }
  }

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    errors.push("Venda deve ter pelo menos um item")
  } else {
    itens.forEach((item, index) => {
      if (!item.peca_id) {
        errors.push(`Item ${index + 1}: ID da peça é obrigatório`)
      } else {
        if (!Number.isInteger(Number(item.peca_id)) || Number(item.peca_id) <= 0) {
          errors.push(`Item ${index + 1}: ID da peça deve ser um número inteiro positivo`)
        }
      }

      if (!item.quantidade) {
        errors.push(`Item ${index + 1}: Quantidade é obrigatória`)
      } else {
        if (!Number.isInteger(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
          errors.push(`Item ${index + 1}: Quantidade deve ser um número inteiro positivo`)
        }
      }

      if (item.valor_unitario === undefined || item.valor_unitario === null || item.valor_unitario === "") {
        errors.push(`Item ${index + 1}: Valor unitário é obrigatório`)
      } else {
        const valor = Number.parseFloat(item.valor_unitario)
        if (isNaN(valor) || valor <= 0) {
          errors.push(`Item ${index + 1}: Valor unitário deve ser um número positivo`)
        }
        if (valor > 99999999.99) {
          errors.push(`Item ${index + 1}: Valor unitário deve ser menor que R$ 99.999.999,99`)
        }
      }
    })
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

const validarTroca = (req, res, next) => {
  const errors = []
  const { venda_id, peca_original_id, peca_nova_id, quantidade, motivo, data_troca } = req.body

  req.body = sanitizeObject(req.body)

  if (!venda_id) {
    errors.push("ID da venda é obrigatório")
  } else {
    if (!Number.isInteger(Number(venda_id)) || Number(venda_id) <= 0) {
      errors.push("ID da venda deve ser um número inteiro positivo")
    }
  }

  if (!peca_original_id) {
    errors.push("ID da peça original é obrigatório")
  } else {
    if (!Number.isInteger(Number(peca_original_id)) || Number(peca_original_id) <= 0) {
      errors.push("ID da peça original deve ser um número inteiro positivo")
    }
  }

  if (!peca_nova_id) {
    errors.push("ID da peça nova é obrigatório")
  } else {
    if (!Number.isInteger(Number(peca_nova_id)) || Number(peca_nova_id) <= 0) {
      errors.push("ID da peça nova deve ser um número inteiro positivo")
    }
  }

  if (!quantidade) {
    errors.push("Quantidade é obrigatória")
  } else {
    if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
      errors.push("Quantidade deve ser um número inteiro positivo")
    }
  }

  if (!motivo || !motivo.trim()) {
    errors.push("Motivo da troca é obrigatório")
  } else {
    const lengthError = validateFieldLength("motivo", motivo.trim(), 255)
    if (lengthError) errors.push(lengthError)
  }

  if (data_troca && data_troca.trim()) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data_troca.trim())) {
      errors.push("Data da troca deve estar no formato YYYY-MM-DD")
    } else {
      const date = new Date(data_troca.trim())
      if (isNaN(date.getTime())) {
        errors.push("Data da troca inválida")
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos",
      details: errors,
    })
  }

  next()
}

module.exports = {
  sanitizeInput,
  sanitizeObject,
  validateFieldLength,
  validateEmail,
  validatePassword,
  validateUserCreation,
  validateUserUpdate,
  validateContact,
  validateAddress,
  validarCategoria,
  validarMarca,
  validarFormaPagamento,
  validarPeca,
  validarImagemPeca,
  validarCliente,
  validarFornecedor,
  validarCompra,
  validarVenda,
  validarTroca,
  validateCpf,
  validateCnpj,
  FIELD_LIMITS,
  validatePessoa,
}
