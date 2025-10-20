const { pool } = require("../../config/database")

const toNullIfEmpty = (value) => {
  if (value === undefined || value === null || value === "") {
    return null
  }
  return value
}

const findAll = async () => {
  // Buscar TODAS as peças (ativas e inativas) para permitir gerenciamento
  const [rows] = await pool.execute(`
        SELECT p.peca_id, p.nome, p.descricao, p.marca_id, p.preco_venda, p.preco_custo,
               p.quantidade_estoque, p.quantidade_minima, p.categoria_id, p.condicao, p.status,
               p.data_cadastro, p.updated_at, p.created_by, p.updated_by,
               c.nome as categoria_nome, m.nome as marca_nome
        FROM peca p
        LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
        LEFT JOIN marca m ON p.marca_id = m.marca_id
        ORDER BY p.nome
    `)
  return rows
}

const create = async (pecaData) => {
  console.log(" Model: criar chamado com pecaData:", pecaData)

  const {
    nome,
    descricao,
    marca_id,
    preco_venda,
    preco_custo,
    preco_compra,
    quantidade_estoque,
    quantidade_minima,
    estoque_minimo,
    categoria_id,
    condicao,
    status,
    created_by,
    codigo,
    localizacao,
  } = pecaData

  const precoCompra = preco_custo || preco_compra
  const estoqueMinimo = quantidade_minima || estoque_minimo

  let statusValue = true // default to active
  if (status === "inativo" || status === false || status === 0 || status === "0") {
    statusValue = false
  }

  console.log(" Model: valores mapeados:")
  console.log(" Model: preco_custo:", precoCompra)
  console.log(" Model: quantidade_minima:", estoqueMinimo)
  console.log(" Model: status:", statusValue)

  const query = `
        INSERT INTO peca (nome, descricao, marca_id, preco_venda, preco_custo, 
                         quantidade_estoque, quantidade_minima, categoria_id, condicao, 
                         status, created_by, codigo, localizacao) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

  console.log(" Model: executando query:", query)

  const params = [
    nome,
    toNullIfEmpty(descricao),
    toNullIfEmpty(marca_id),
    preco_venda,
    toNullIfEmpty(precoCompra),
    quantidade_estoque || 0,
    toNullIfEmpty(estoqueMinimo),
    toNullIfEmpty(categoria_id),
    condicao || "novo",
    statusValue, // Use the converted status value
    toNullIfEmpty(created_by),
    toNullIfEmpty(codigo),
    toNullIfEmpty(localizacao),
  ]

  const hasUndefined = params.some((p) => p === undefined)
  if (hasUndefined) {
    console.error(" Model: ERRO - parâmetros contêm undefined!")
    console.error(" Model: pecaData original:", JSON.stringify(pecaData, null, 2))
    throw new Error("Parâmetros contêm valores undefined. Verifique os dados enviados.")
  }

  const [result] = await pool.execute(query, params)

  console.log(" Model: resultado da inserção:", result)
  console.log(" Model: insertId:", result.insertId)

  return result.insertId
}

const update = async (id, pecaData) => {
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
    updated_by,
    codigo,
    localizacao,
  } = pecaData
  const query = `
        UPDATE peca 
        SET nome=?, descricao=?, marca_id=?, preco_venda=?, preco_custo=?, 
            quantidade_estoque=?, quantidade_minima=?, categoria_id=?, condicao=?,
            updated_by=?, updated_at=CURRENT_TIMESTAMP,
            codigo=?, localizacao=?
        WHERE peca_id = ?
    `
  const [result] = await pool.execute(query, [
    nome,
    toNullIfEmpty(descricao),
    toNullIfEmpty(marca_id),
    preco_venda,
    toNullIfEmpty(preco_custo),
    quantidade_estoque,
    toNullIfEmpty(quantidade_minima),
    toNullIfEmpty(categoria_id),
    condicao || "novo",
    toNullIfEmpty(updated_by),
    toNullIfEmpty(codigo),
    toNullIfEmpty(localizacao),
    id,
  ])
  return result
}

// Método para soft delete (manter compatibilidade)
const remove = async (id) => {
  const [result] = await pool.execute("UPDATE peca SET status = FALSE WHERE peca_id = ?", [id])
  return result
}

// Novo método específico para alteração de status
const updateStatus = async (id, status) => {
  const query = "UPDATE peca SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE peca_id = ?"
  const [result] = await pool.execute(query, [status, id])
  return result
}

const buscarTodos = async (incluirInativos = false, filtros = {}) => {
  console.log(" Model: iniciando buscarTodos, incluirInativos:", incluirInativos)

  let whereClause = ""
  const params = []

  if (!incluirInativos) {
    whereClause = "WHERE p.status = TRUE"
  }

  // Add filters if provided
  if (filtros.categoria_id) {
    whereClause += whereClause ? " AND" : "WHERE"
    whereClause += " p.categoria_id = ?"
    params.push(filtros.categoria_id)
  }

  if (filtros.marca_id) {
    whereClause += whereClause ? " AND" : "WHERE"
    whereClause += " p.marca_id = ?"
    params.push(filtros.marca_id)
  }

  const query = `
    SELECT p.peca_id, p.codigo, p.nome, p.descricao, p.marca_id, p.preco_venda, p.preco_custo,
           p.quantidade_estoque, p.quantidade_minima, p.categoria_id, p.condicao, p.status,
           p.data_cadastro, p.updated_at, p.created_by, p.updated_by, p.localizacao,
           c.nome as categoria_nome, m.nome as marca_nome,
           (SELECT i.referencia_url 
            FROM peca_imagem pi 
            JOIN imagem i ON pi.imagem_id = i.imagem_id 
            WHERE pi.peca_id = p.peca_id 
            LIMIT 1) as imagem_principal
    FROM peca p
    LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
    LEFT JOIN marca m ON p.marca_id = m.marca_id
    ${whereClause}
    ORDER BY p.nome
  `

  console.log(" Model: executando query:", query)
  console.log(" Model: parâmetros:", params)

  try {
    const [rows] = await pool.execute(query, params)
    console.log(" Model: query executada com sucesso, linhas:", rows.length)
    return rows
  } catch (error) {
    console.error(" Model: erro na query:", error)
    console.error(" Model: query que falhou:", query)
    throw error
  }
}

const buscarPorId = async (id) => {
  const query = `
    SELECT p.peca_id, p.codigo, p.nome, p.descricao, p.marca_id, p.preco_venda, p.preco_custo,
           p.quantidade_estoque, p.quantidade_minima, p.categoria_id, p.condicao, p.status,
           p.data_cadastro, p.updated_at, p.created_by, p.updated_by, p.localizacao,
           c.nome as categoria_nome, m.nome as marca_nome,
           (SELECT pi.imagem_id 
            FROM peca_imagem pi 
            WHERE pi.peca_id = p.peca_id 
            LIMIT 1) as imagem_principal_id
    FROM peca p
    LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
    LEFT JOIN marca m ON p.marca_id = m.marca_id
    WHERE p.peca_id = ?
  `
  const [rows] = await pool.execute(query, [id])
  return rows[0] || null
}

const atualizar = async (id, pecaData) => {
  const {
    nome,
    descricao,
    marca_id,
    preco_venda,
    preco_custo = pecaData.preco_compra, // Aceitar preco_compra como alternativa
    quantidade_estoque,
    quantidade_minima = pecaData.estoque_minimo, // Aceitar estoque_minimo como alternativa
    categoria_id,
    condicao,
    updated_by,
    codigo,
    localizacao,
  } = pecaData

  const query = `
    UPDATE peca 
    SET nome = ?, descricao = ?, marca_id = ?, preco_venda = ?, preco_custo = ?,
        quantidade_estoque = ?, quantidade_minima = ?, categoria_id = ?, 
        condicao = ?, updated_by = ?,
        updated_at = CURRENT_TIMESTAMP,
        codigo = ?, localizacao = ?
    WHERE peca_id = ?
  `

  const [result] = await pool.execute(query, [
    nome,
    toNullIfEmpty(descricao),
    toNullIfEmpty(marca_id),
    preco_venda,
    toNullIfEmpty(preco_custo),
    quantidade_estoque || 0,
    toNullIfEmpty(quantidade_minima),
    toNullIfEmpty(categoria_id),
    condicao || "novo",
    toNullIfEmpty(updated_by),
    toNullIfEmpty(codigo),
    toNullIfEmpty(localizacao),
    id,
  ])

  return result.affectedRows > 0
}

const inativar = async (id) => {
  const [result] = await pool.execute(
    "UPDATE peca SET status = FALSE, updated_at = CURRENT_TIMESTAMP WHERE peca_id = ?",
    [id],
  )
  return result.affectedRows > 0
}

const adicionarImagem = async (pecaId, imagemId) => {
  const query = "INSERT INTO peca_imagem (peca_id, imagem_id) VALUES (?, ?)"
  const [result] = await pool.execute(query, [pecaId, imagemId])
  return result.affectedRows > 0
}

const removerImagem = async (pecaId, imagemId) => {
  const query = "DELETE FROM peca_imagem WHERE peca_id = ? AND imagem_id = ?"
  const [result] = await pool.execute(query, [pecaId, imagemId])
  return result.affectedRows > 0
}

const buscarImagensPeca = async (pecaId) => {
  const query = `
    SELECT i.imagem_id, i.referencia_url, i.descricao, i.status
    FROM imagem i
    INNER JOIN peca_imagem pi ON i.imagem_id = pi.imagem_id
    WHERE pi.peca_id = ? AND i.status = TRUE
    ORDER BY i.created_at
  `
  const [rows] = await pool.execute(query, [pecaId])
  return rows
}

module.exports = {
  findAll,
  create,
  criar: create,
  update,
  remove,
  updateStatus,
  buscarTodos,
  buscarPorId,
  atualizar,
  inativar,
  adicionarImagem,
  removerImagem,
  buscarImagensPeca,
}
