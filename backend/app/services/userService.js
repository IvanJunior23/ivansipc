const userModel = require("../models/userModel")
const bcrypt = require("bcryptjs")
const { pool } = require("../../config/database")

const getAllUsers = async () => {
  return await userModel.findAll()
}

const createUser = async (userData) => {
  console.log("[DEBUG] Dados recebidos no service:", userData)

  const { email, senha, pessoa_id, tipo_usuario } = userData

  if (!pessoa_id) {
    throw new Error("Pessoa é obrigatória")
  }
  if (!email) {
    throw new Error("Email é obrigatório")
  }
  if (!senha) {
    throw new Error("Senha é obrigatória")
  }
  if (!tipo_usuario) {
    throw new Error("Tipo de usuário é obrigatório")
  }

  console.log("[DEBUG] Verificando email existente:", email)
  const existingUser = await userModel.findByEmail(email)
  if (existingUser) {
    throw new Error("E-mail já está em uso")
  }

  console.log("[DEBUG] Verificando pessoa com ID:", pessoa_id)
  const [pessoaRows] = await pool.execute("SELECT * FROM pessoa WHERE pessoa_id = ? AND status = 1", [pessoa_id])
  console.log("[DEBUG] Pessoa encontrada:", pessoaRows.length > 0 ? pessoaRows[0] : "Nenhuma")

  if (pessoaRows.length === 0) {
    throw new Error("Pessoa não encontrada ou inativa")
  }

  console.log("[DEBUG] Verificando se pessoa já tem usuário...")
  const [usuarioExistente] = await pool.execute("SELECT * FROM usuario WHERE pessoa_id = ?", [pessoa_id])
  console.log("[DEBUG] Usuário existente:", usuarioExistente.length > 0 ? "Sim" : "Não")

  if (usuarioExistente.length > 0) {
    throw new Error("Esta pessoa já possui um usuário associado")
  }

  console.log("[DEBUG] Criptografando senha...")
  const senhaCriptografada = await bcrypt.hash(senha, 10)

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    console.log("[DEBUG] Criando usuário no banco...")
    const newUserId = await userModel.create({ ...userData, senhaCriptografada }, connection)
    await connection.commit()
    console.log("[DEBUG] Usuário criado com ID:", newUserId)
    return { id: newUserId }
  } catch (error) {
    await connection.rollback()
    console.error("[ERROR] Erro na transação:", error.message)
    console.error("[ERROR] Stack completo:", error.stack)
    throw error
  } finally {
    connection.release()
  }
}

const updateUser = async (id, userData) => {
  if (userData.senha) {
    userData.senhaCriptografada = await bcrypt.hash(userData.senha, 10)
    delete userData.senha
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await userModel.update(id, userData, connection)
    await connection.commit()
    return { message: "Usuário atualizado com sucesso" }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

const toggleUserStatus = async (id) => {
  const result = await userModel.toggleStatus(id)
  if (result.affectedRows === 0) {
    throw new Error("Usuário não encontrado")
  }
  return { message: "Status do usuário alterado com sucesso" }
}

module.exports = { getAllUsers, createUser, updateUser, toggleUserStatus }
