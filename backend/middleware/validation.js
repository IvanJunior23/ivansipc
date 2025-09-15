// backend/middleware/validation.js
const validator = require("validator")

// Database field length constraints based on schema
const FIELD_LIMITS = {
  // Usuario table
  email: 255,
  senha: 255,

  // Pessoa table
  nome: 150,

  // Contato table
  nome_completo: 150,
  telefone: 20,
  email_contato: 150,

  // Endereco table
  logradouro: 255,
  numero: 20,
  complemento: 100,
  bairro: 100,
  cidade: 100,
  estado: 2,
  cep: 9,

  // Categoria table
  categoria_nome: 100,
  categoria_descricao: 65535, // TEXT field

  // Marca table
  marca_nome: 100,
  marca_descricao: 65535, // TEXT field

  // Forma_pagamento table
  forma_pagamento_nome: 100,
  forma_pagamento_descricao: 65535, // TEXT field

  // Peca table
  nome: 255,
  descricao: 65535, // TEXT field
  imagem_url: 500,
}

// Sanitize input by trimming whitespace and escaping HTML
const sanitizeInput = (value) => {
  if (typeof value !== "string") return value
  return validator.escape(value.trim())
}

// Sanitize all string fields in an object
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

// Validate field length according to database constraints
const validateFieldLength = (fieldName, value, customLimit = null) => {
  if (typeof value !== "string") return null

  const limit = customLimit || FIELD_LIMITS[fieldName]
  if (!limit) return null

  if (value.length > limit) {
    return `${fieldName} deve ter no máximo ${limit} caracteres`
  }
  return null
}

// Validate email format and length
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

// Validate password strength and confirmation
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

  // Password strength validation
  if (!/(?=.*[a-z])/.test(trimmedSenha)) {
    errors.push("Senha deve conter pelo menos uma letra minúscula")
  }

  if (!/(?=.*[A-Z])/.test(trimmedSenha)) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula")
  }

  if (!/(?=.*\d)/.test(trimmedSenha)) {
    errors.push("Senha deve conter pelo menos um número")
  }

  // Confirm password validation
  if (confirmarSenha !== null && trimmedSenha !== confirmarSenha.trim()) {
    errors.push("Confirmação de senha não confere")
  }

  return errors
}

// Validate user creation data
const validateUserCreation = (req, res, next) => {
  const errors = []
  const { nome, email, confirmarEmail, senha, confirmarSenha, tipo_usuario } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome
  if (!nome || !nome.trim()) {
    errors.push("Nome é obrigatório")
  } else {
    const lengthError = validateFieldLength("nome", nome.trim())
    if (lengthError) errors.push(lengthError)
  }

  // Validate email
  const emailErrors = validateEmail(email)
  errors.push(...emailErrors)

  // Validate email confirmation
  if (confirmarEmail !== undefined) {
    if (!confirmarEmail || !confirmarEmail.trim()) {
      errors.push("Confirmação de e-mail é obrigatória")
    } else if (email && email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()) {
      errors.push("Confirmação de e-mail não confere")
    }
  }

  // Validate password
  const passwordErrors = validatePassword(senha, confirmarSenha)
  errors.push(...passwordErrors)

  // Validate tipo_usuario
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

// Validate user update data
const validateUserUpdate = (req, res, next) => {
  const errors = []
  const { nome, email, confirmarEmail, senha, confirmarSenha, tipo_usuario } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome if provided
  if (nome !== undefined) {
    if (!nome || !nome.trim()) {
      errors.push("Nome não pode estar vazio")
    } else {
      const lengthError = validateFieldLength("nome", nome.trim())
      if (lengthError) errors.push(lengthError)
    }
  }

  // Validate email if provided
  if (email !== undefined) {
    const emailErrors = validateEmail(email)
    errors.push(...emailErrors)

    // Validate email confirmation if provided
    if (confirmarEmail !== undefined) {
      if (!confirmarEmail || !confirmarEmail.trim()) {
        errors.push("Confirmação de e-mail é obrigatória quando alterando e-mail")
      } else if (email.trim().toLowerCase() !== confirmarEmail.trim().toLowerCase()) {
        errors.push("Confirmação de e-mail não confere")
      }
    }
  }

  // Validate password if provided
  if (senha !== undefined && senha.trim()) {
    const passwordErrors = validatePassword(senha, confirmarSenha)
    errors.push(...passwordErrors)
  }

  // Validate tipo_usuario if provided
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

// Validate contact data
const validateContact = (req, res, next) => {
  const errors = []
  const { nome_completo, telefone, email } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome_completo
  if (!nome_completo || !nome_completo.trim()) {
    errors.push("Nome completo é obrigatório")
  } else {
    const lengthError = validateFieldLength("nome_completo", nome_completo.trim())
    if (lengthError) errors.push(lengthError)
  }

  // Validate telefone
  if (!telefone || !telefone.trim()) {
    errors.push("Telefone é obrigatório")
  } else {
    const lengthError = validateFieldLength("telefone", telefone.trim())
    if (lengthError) errors.push(lengthError)

    // Basic phone format validation
    const phoneRegex = /^[\d\s\-$$$$+]+$/
    if (!phoneRegex.test(telefone.trim())) {
      errors.push("Formato de telefone inválido")
    }
  }

  // Validate email if provided (optional field)
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
    const { nome, status } = req.body;
    const errors = [];

    // Validar nome
    if (!nome || nome.trim().length === 0) {
        errors.push({ field: 'nome', message: 'Nome é obrigatório' });
    } else if (nome.trim().length < 2) {
        errors.push({ field: 'nome', message: 'Nome deve ter pelo menos 2 caracteres' });
    } else if (nome.trim().length > 255) {
        errors.push({ field: 'nome', message: 'Nome deve ter no máximo 255 caracteres' });
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome.trim())) {
        errors.push({ field: 'nome', message: 'Nome deve conter apenas letras e espaços' });
    }

    // Validar status (opcional)
    if (status && !['ativo', 'inativo'].includes(status)) {
        errors.push({ field: 'status', message: 'Status deve ser "ativo" ou "inativo"' });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors
        });
    }

    next();
};

// Validate address data
const validateAddress = (req, res, next) => {
  const errors = []
  const { logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate required fields
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

  // Validate estado format (2 characters)
  if (estado && estado.trim() && estado.trim().length !== 2) {
    errors.push("Estado deve ter exatamente 2 caracteres")
  }

  // Validate CEP format
  if (cep && cep.trim()) {
    const cepRegex = /^\d{5}-?\d{3}$/
    if (!cepRegex.test(cep.trim())) {
      errors.push("Formato de CEP inválido (use: 12345-678 ou 12345678)")
    }
  }

  // Validate complemento if provided (optional field)
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

// Validate category data
const validarCategoria = (req, res, next) => {
  const errors = []
  const { nome, descricao } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome (required)
  if (!nome || !nome.trim()) {
    errors.push("Nome da categoria é obrigatório")
  } else {
    const lengthError = validateFieldLength("categoria_nome", nome.trim())
    if (lengthError) errors.push(lengthError)
  }

  // Validate descricao if provided (optional field)
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

// Validate brand data
const validarMarca = (req, res, next) => {
  const errors = []
  const { nome, descricao } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome (required)
  if (!nome || !nome.trim()) {
    errors.push("Nome da marca é obrigatório")
  } else {
    const lengthError = validateFieldLength("marca_nome", nome.trim())
    if (lengthError) errors.push(lengthError)
  }

  // Validate descricao if provided (optional field)
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

// Validate payment method data
const validarFormaPagamento = (req, res, next) => {
  const errors = []
  const { nome, descricao } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome (required)
  if (!nome || !nome.trim()) {
    errors.push("Nome da forma de pagamento é obrigatório")
  } else {
    const lengthError = validateFieldLength("forma_pagamento_nome", nome.trim())
    if (lengthError) errors.push(lengthError)
  }

  // Validate descricao if provided (optional field)
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

// Validate parts data
const validarPeca = (req, res, next) => {
  const errors = []
  const {
    nome,
    descricao,
    marca_id,
    preco_venda,
    preco_custo,
    quantidade_estoque,
    quantidade_minima,
    categoria_id,
    condicao,
  } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome (required)
  if (!nome || !nome.trim()) {
    errors.push("Nome da peça é obrigatório")
  } else {
    const lengthError = validateFieldLength("nome", nome.trim(), 255)
    if (lengthError) errors.push(lengthError)
  }

  // Validate descricao if provided (optional field)
  if (descricao && descricao.trim()) {
    const lengthError = validateFieldLength("descricao", descricao.trim(), 65535)
    if (lengthError) errors.push(lengthError)
  }

  // Validate marca_id if provided (optional)
  if (marca_id !== undefined && marca_id !== null && marca_id !== "") {
    if (!Number.isInteger(Number(marca_id)) || Number(marca_id) <= 0) {
      errors.push("ID da marca deve ser um número inteiro positivo")
    }
  }

  // Validate categoria_id if provided (optional)
  if (categoria_id !== undefined && categoria_id !== null && categoria_id !== "") {
    if (!Number.isInteger(Number(categoria_id)) || Number(categoria_id) <= 0) {
      errors.push("ID da categoria deve ser um número inteiro positivo")
    }
  }

  // Validate preco_venda (required)
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

  // Validate preco_custo (required)
  if (preco_custo === undefined || preco_custo === null || preco_custo === "") {
    errors.push("Preço de custo é obrigatório")
  } else {
    const preco = Number.parseFloat(preco_custo)
    if (isNaN(preco) || preco < 0) {
      errors.push("Preço de custo deve ser um número positivo")
    }
    if (preco > 99999999.99) {
      errors.push("Preço de custo deve ser menor que R$ 99.999.999,99")
    }
  }

  // Validate quantidade_estoque if provided (optional, defaults to 0)
  if (quantidade_estoque !== undefined && quantidade_estoque !== null && quantidade_estoque !== "") {
    if (!Number.isInteger(Number(quantidade_estoque)) || Number(quantidade_estoque) < 0) {
      errors.push("Quantidade em estoque deve ser um número inteiro não negativo")
    }
  }

  // Validate quantidade_minima (required)
  if (quantidade_minima === undefined || quantidade_minima === null || quantidade_minima === "") {
    errors.push("Quantidade mínima é obrigatória")
  } else {
    if (!Number.isInteger(Number(quantidade_minima)) || Number(quantidade_minima) < 0) {
      errors.push("Quantidade mínima deve ser um número inteiro não negativo")
    }
  }

  // Validate condicao if provided (optional, defaults to 'novo')
  if (condicao !== undefined && condicao !== null && condicao !== "") {
    if (!["novo", "usado"].includes(condicao)) {
      errors.push("Condição deve ser 'novo' ou 'usado'")
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

// Validate image data for parts
const validarImagemPeca = (req, res, next) => {
  const errors = []
  const { imagem_url, descricao } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate imagem_url (required)
  if (!imagem_url || !imagem_url.trim()) {
    errors.push("URL da imagem é obrigatória")
  } else {
    const lengthError = validateFieldLength("imagem_url", imagem_url.trim(), 500)
    if (lengthError) errors.push(lengthError)

    // Basic URL validation
    try {
      new URL(imagem_url.trim())
    } catch {
      errors.push("URL da imagem deve ser uma URL válida")
    }
  }

  // Validate descricao if provided (optional field)
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

// Validate CPF format
const validateCpf = (cpf) => {
  if (!cpf || !cpf.trim()) {
    return "CPF é obrigatório"
  }

  const cleanCpf = cpf.replace(/\D/g, "")

  if (cleanCpf.length !== 11) {
    return "CPF deve ter 11 dígitos"
  }

  // Check for invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return "CPF inválido"
  }

  // CPF validation algorithm
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

// Validate CNPJ format
const validateCnpj = (cnpj) => {
  if (!cnpj || !cnpj.trim()) {
    return "CNPJ é obrigatório"
  }

  const cleanCnpj = cnpj.replace(/\D/g, "")

  if (cleanCnpj.length !== 14) {
    return "CNPJ deve ter 14 dígitos"
  }

  // Check for invalid CNPJs (all same digits)
  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return "CNPJ inválido"
  }

  // CNPJ validation algorithm
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

// Validate customer data
const validarCliente = (req, res, next) => {
  const errors = []
  const { nome, cpf, contato, endereco } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome (required)
  if (!nome || !nome.trim()) {
    errors.push("Nome é obrigatório")
  } else {
    const lengthError = validateFieldLength("nome", nome.trim(), 150)
    if (lengthError) errors.push(lengthError)
  }

  // Validate CPF (required)
  const cpfError = validateCpf(cpf)
  if (cpfError) errors.push(cpfError)

  // Validate contato if provided (optional)
  if (contato) {
    if (contato.nome_completo && !contato.nome_completo.trim()) {
      errors.push("Nome completo do contato não pode estar vazio")
    } else if (contato.nome_completo) {
      const lengthError = validateFieldLength("nome_completo", contato.nome_completo.trim(), 150)
      if (lengthError) errors.push(lengthError)
    }

    if (contato.telefone && !contato.telefone.trim()) {
      errors.push("Telefone do contato não pode estar vazio")
    } else if (contato.telefone) {
      const lengthError = validateFieldLength("telefone", contato.telefone.trim(), 20)
      if (lengthError) errors.push(lengthError)
    }

    if (contato.email && contato.email.trim()) {
      const emailErrors = validateEmail(contato.email)
      errors.push(...emailErrors)
    }
  }

  // Validate endereco if provided (optional)
  if (endereco) {
    const requiredAddressFields = ["logradouro", "numero", "bairro", "cidade", "estado", "cep"]

    requiredAddressFields.forEach((field) => {
      if (endereco[field] && !endereco[field].trim()) {
        errors.push(`${field} do endereço não pode estar vazio`)
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

// Validate supplier data
const validarFornecedor = (req, res, next) => {
  const errors = []
  const { nome, cnpj, contato, endereco } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate nome (required)
  if (!nome || !nome.trim()) {
    errors.push("Nome é obrigatório")
  } else {
    const lengthError = validateFieldLength("nome", nome.trim(), 150)
    if (lengthError) errors.push(lengthError)
  }

  // Validate CNPJ (required)
  const cnpjError = validateCnpj(cnpj)
  if (cnpjError) errors.push(cnpjError)

  // Validate contato if provided (optional)
  if (contato) {
    if (contato.nome_completo && !contato.nome_completo.trim()) {
      errors.push("Nome completo do contato não pode estar vazio")
    } else if (contato.nome_completo) {
      const lengthError = validateFieldLength("nome_completo", contato.nome_completo.trim(), 150)
      if (lengthError) errors.push(lengthError)
    }

    if (contato.telefone && !contato.telefone.trim()) {
      errors.push("Telefone do contato não pode estar vazio")
    } else if (contato.telefone) {
      const lengthError = validateFieldLength("telefone", contato.telefone.trim(), 20)
      if (lengthError) errors.push(lengthError)
    }

    if (contato.email && contato.email.trim()) {
      const emailErrors = validateEmail(contato.email)
      errors.push(...emailErrors)
    }
  }

  // Validate endereco if provided (optional)
  if (endereco) {
    const requiredAddressFields = ["logradouro", "numero", "bairro", "cidade", "estado", "cep"]

    requiredAddressFields.forEach((field) => {
      if (endereco[field] && !endereco[field].trim()) {
        errors.push(`${field} do endereço não pode estar vazio`)
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

// Validate purchase data
const validarCompra = (req, res, next) => {
  const errors = []
  const { fornecedor_id, data_compra, itens } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate fornecedor_id (required)
  if (!fornecedor_id) {
    errors.push("ID do fornecedor é obrigatório")
  } else {
    if (!Number.isInteger(Number(fornecedor_id)) || Number(fornecedor_id) <= 0) {
      errors.push("ID do fornecedor deve ser um número inteiro positivo")
    }
  }

  // Validate data_compra if provided (optional, defaults to today)
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

  // Validate itens (required)
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    errors.push("Compra deve ter pelo menos um item")
  } else {
    itens.forEach((item, index) => {
      // Validate peca_id
      if (!item.peca_id) {
        errors.push(`Item ${index + 1}: ID da peça é obrigatório`)
      } else {
        if (!Number.isInteger(Number(item.peca_id)) || Number(item.peca_id) <= 0) {
          errors.push(`Item ${index + 1}: ID da peça deve ser um número inteiro positivo`)
        }
      }

      // Validate quantidade
      if (!item.quantidade) {
        errors.push(`Item ${index + 1}: Quantidade é obrigatória`)
      } else {
        if (!Number.isInteger(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
          errors.push(`Item ${index + 1}: Quantidade deve ser um número inteiro positivo`)
        }
      }

      // Validate valor_unitario
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

// Validate sales data
const validarVenda = (req, res, next) => {
  const errors = []
  const { cliente_id, data_venda, forma_pagamento_id, itens } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate cliente_id (required)
  if (!cliente_id) {
    errors.push("ID do cliente é obrigatório")
  } else {
    if (!Number.isInteger(Number(cliente_id)) || Number(cliente_id) <= 0) {
      errors.push("ID do cliente deve ser um número inteiro positivo")
    }
  }

  // Validate forma_pagamento_id (required)
  if (!forma_pagamento_id) {
    errors.push("ID da forma de pagamento é obrigatório")
  } else {
    if (!Number.isInteger(Number(forma_pagamento_id)) || Number(forma_pagamento_id) <= 0) {
      errors.push("ID da forma de pagamento deve ser um número inteiro positivo")
    }
  }

  // Validate data_venda if provided (optional, defaults to today)
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

  // Validate itens (required)
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    errors.push("Venda deve ter pelo menos um item")
  } else {
    itens.forEach((item, index) => {
      // Validate peca_id
      if (!item.peca_id) {
        errors.push(`Item ${index + 1}: ID da peça é obrigatório`)
      } else {
        if (!Number.isInteger(Number(item.peca_id)) || Number(item.peca_id) <= 0) {
          errors.push(`Item ${index + 1}: ID da peça deve ser um número inteiro positivo`)
        }
      }

      // Validate quantidade
      if (!item.quantidade) {
        errors.push(`Item ${index + 1}: Quantidade é obrigatória`)
      } else {
        if (!Number.isInteger(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
          errors.push(`Item ${index + 1}: Quantidade deve ser um número inteiro positivo`)
        }
      }

      // Validate valor_unitario
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

// Validate exchange data
const validarTroca = (req, res, next) => {
  const errors = []
  const { venda_id, peca_original_id, peca_nova_id, quantidade, motivo, data_troca } = req.body

  // Sanitize input data
  req.body = sanitizeObject(req.body)

  // Validate venda_id (required)
  if (!venda_id) {
    errors.push("ID da venda é obrigatório")
  } else {
    if (!Number.isInteger(Number(venda_id)) || Number(venda_id) <= 0) {
      errors.push("ID da venda deve ser um número inteiro positivo")
    }
  }

  // Validate peca_original_id (required)
  if (!peca_original_id) {
    errors.push("ID da peça original é obrigatório")
  } else {
    if (!Number.isInteger(Number(peca_original_id)) || Number(peca_original_id) <= 0) {
      errors.push("ID da peça original deve ser um número inteiro positivo")
    }
  }

  // Validate peca_nova_id (required)
  if (!peca_nova_id) {
    errors.push("ID da peça nova é obrigatório")
  } else {
    if (!Number.isInteger(Number(peca_nova_id)) || Number(peca_nova_id) <= 0) {
      errors.push("ID da peça nova deve ser um número inteiro positivo")
    }
  }

  // Validate quantidade (required)
  if (!quantidade) {
    errors.push("Quantidade é obrigatória")
  } else {
    if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
      errors.push("Quantidade deve ser um número inteiro positivo")
    }
  }

  // Validate motivo (required)
  if (!motivo || !motivo.trim()) {
    errors.push("Motivo da troca é obrigatório")
  } else {
    const lengthError = validateFieldLength("motivo", motivo.trim(), 255)
    if (lengthError) errors.push(lengthError)
  }

  // Validate data_troca if provided (optional, defaults to today)
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
