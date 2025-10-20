const { pool } = require("../../config/database")

const findAll = async () => {
  console.log(" Model: marcaModel.findAll() chamado")
  console.log(" Model: executando query para buscar todas as marcas")

  const query = `
    SELECT marca_id, nome, descricao, status, 
           created_at, updated_at, created_by, updated_by
    FROM marca 
    ORDER BY nome
  `

  console.log(" Model: query:", query)

  try {
    const [rows] = await pool.execute(query)
    console.log(" Model: marcas encontradas:", rows.length)
    return rows
  } catch (error) {
    console.error(" Model: erro ao buscar marcas:", error)
    throw error
  }
}

const buscarPorId = async (id) => {
  const [rows] = await pool.execute(
    `
        SELECT marca_id, nome, descricao, status, 
               created_at, updated_at, created_by, updated_by
        FROM marca 
        WHERE marca_id = ?
    `,
    [id],
  )
  return rows[0]
}

const create = async (marcaData) => {
  const { nome, descricao, created_by } = marcaData
  const query = `
        INSERT INTO marca (nome, descricao, status, created_by) 
        VALUES (?, ?, TRUE, ?)
    `
  const [result] = await pool.execute(query, [nome, descricao, created_by])
  return { id: result.insertId }
}

const update = async (id, marcaData) => {
  const { nome, descricao, updated_by } = marcaData
  const query = `
        UPDATE marca 
        SET nome=?, descricao=?, updated_by=?, updated_at=CURRENT_TIMESTAMP 
        WHERE marca_id = ?
    `
  const [result] = await pool.execute(query, [nome, descricao, updated_by, id])
  return result
}

const remove = async (id) => {
  const [result] = await pool.execute("UPDATE marca SET status = FALSE WHERE marca_id = ?", [id])
  return result
}

const updateStatus = async (id, status) => {
  const query = "UPDATE marca SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE marca_id = ?"
  const [result] = await pool.execute(query, [status, id])
  return result
}

module.exports = { findAll, buscarPorId, create, update, remove, updateStatus }
