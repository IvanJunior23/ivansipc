const { pool } = require("../../config/database")

const findAll = async () => {
  const query = `
        SELECT u.usuario_id, p.nome, u.email, u.tipo_usuario, u.status
        FROM usuario u
        JOIN pessoa p ON u.pessoa_id = p.pessoa_id
        ORDER BY p.nome;
    `
  const [users] = await pool.execute(query)
  return users
}

const findByEmail = async (email) => {
  const query = `
        SELECT u.*, p.nome
        FROM usuario u
        JOIN pessoa p ON u.pessoa_id = p.pessoa_id
        WHERE u.email = ?;
    `
  const [rows] = await pool.execute(query, [email])
  return rows[0]
}

const findById = async (id) => {
  const query = `
        SELECT u.usuario_id, p.nome, u.email, u.tipo_usuario, u.status
        FROM usuario u
        JOIN pessoa p ON u.pessoa_id = p.pessoa_id
        WHERE u.usuario_id = ?;
    `
  const [rows] = await pool.execute(query, [id])
  return rows[0]
}

const create = async (userData, connection) => {
  const conn = connection || pool // Usa a conexão da transação ou o pool

  // 1. Inserir na tabela pessoa
  const pessoaQuery = "INSERT INTO pessoa (nome) VALUES (?)"
  const [pessoaResult] = await conn.execute(pessoaQuery, [userData.nome])
  const pessoaId = pessoaResult.insertId

  // 2. Inserir na tabela usuario
  const { email, senhaCriptografada, tipo_usuario } = userData
  const usuarioQuery = "INSERT INTO usuario (pessoa_id, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)"
  const [usuarioResult] = await conn.execute(usuarioQuery, [pessoaId, email, senhaCriptografada, tipo_usuario])

  return usuarioResult.insertId
}

const update = async (id, userData, connection) => {
  const conn = connection || pool
  const { nome, email, tipo_usuario, senhaCriptografada } = userData

  // 1. Obter o pessoa_id a partir do usuario_id
  const [userRows] = await conn.execute("SELECT pessoa_id FROM usuario WHERE usuario_id = ?", [id])
  if (userRows.length === 0) {
    throw new Error("Usuário não encontrado")
  }
  const pessoaId = userRows[0].pessoa_id

  // 2. Atualizar a tabela pessoa
  if (nome) {
    await conn.execute("UPDATE pessoa SET nome = ? WHERE pessoa_id = ?", [nome, pessoaId])
  }

  // 3. Atualizar a tabela usuario
  const userFields = []
  const userValues = []
  if (email) {
    userFields.push("email = ?")
    userValues.push(email)
  }
  if (tipo_usuario) {
    userFields.push("tipo_usuario = ?")
    userValues.push(tipo_usuario)
  }
  if (senhaCriptografada) {
    userFields.push("senha = ?")
    userValues.push(senhaCriptografada)
  }

  if (userFields.length > 0) {
    userValues.push(id)
    const usuarioQuery = `UPDATE usuario SET ${userFields.join(", ")} WHERE usuario_id = ?`
    await conn.execute(usuarioQuery, userValues)
  }
}

const toggleStatus = async (id) => {
  const query = "UPDATE usuario SET status = NOT status WHERE usuario_id = ?"
  const [result] = await pool.execute(query, [id])
  return result
}

const updatePassword = async (userId, hashedPassword) => {
  const query = "UPDATE usuario SET senha = ? WHERE usuario_id = ?"
  const [result] = await pool.execute(query, [hashedPassword, userId])
  return result
}

module.exports = { findAll, findByEmail, findById, create, update, toggleStatus, updatePassword }
