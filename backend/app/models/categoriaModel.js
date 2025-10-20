const { pool } = require("../../config/database")

const findAll = async () => {
  const [rows] = await pool.execute(`
        SELECT categoria_id, nome, descricao, status, 
               created_at, updated_at, created_by, updated_by
        FROM categoria 
        ORDER BY nome
    `)
  return rows
}

const buscarPorId = async (id) => {
  const [rows] = await pool.execute(
    `
        SELECT categoria_id, nome, descricao, status, 
               created_at, updated_at, created_by, updated_by
        FROM categoria 
        WHERE categoria_id = ?
    `,
    [id],
  )
  return rows[0]
}

const create = async (categoryData) => {
  const { nome, descricao, created_by } = categoryData
  const query = `
        INSERT INTO categoria (nome, descricao, status, created_by) 
        VALUES (?, ?, TRUE, ?)
    `
  const [result] = await pool.execute(query, [nome, descricao, created_by])
  return { id: result.insertId }
}

const update = async (id, categoryData) => {
  const { nome, descricao, updated_by } = categoryData
  const query = `
        UPDATE categoria 
        SET nome=?, descricao=?, updated_by=?, updated_at=CURRENT_TIMESTAMP 
        WHERE categoria_id = ?
    `
  const [result] = await pool.execute(query, [nome, descricao, updated_by, id])
  return result
}

const remove = async (id) => {
  const [result] = await pool.execute("UPDATE categoria SET status = FALSE WHERE categoria_id = ?", [id])
  return result
}

const updateStatus = async (id, status) => {
  const query = "UPDATE categoria SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE categoria_id = ?"
  const [result] = await pool.execute(query, [status, id])
  return result
}

module.exports = { findAll, buscarPorId, create, update, remove, updateStatus }
