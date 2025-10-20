const { pool } = require("../../config/database")

class FornecedorModel {
  static async criar(fornecedor) {
    console.log(" 🔍 Model criar - Dados recebidos:", fornecedor)
    console.log(" 🔍 Model criar - pessoa_id:", fornecedor.pessoa_id, "tipo:", typeof fornecedor.pessoa_id)
    console.log(" 🔍 Model criar - cnpj:", fornecedor.cnpj, "tipo:", typeof fornecedor.cnpj)
    console.log(" 🔍 Model criar - created_by:", fornecedor.created_by, "tipo:", typeof fornecedor.created_by)

    const query = `
      INSERT INTO fornecedor (pessoa_id, cnpj, created_by) 
      VALUES (?, ?, ?)
    `
    const params = [fornecedor.pessoa_id, fornecedor.cnpj, fornecedor.created_by || null]

    console.log(" 🔍 Model criar - Query:", query)
    console.log(" 🔍 Model criar - Params:", params)

    const [result] = await pool.execute(query, params)

    console.log(" ✅ Model criar - Fornecedor criado com ID:", result.insertId)
    return result.insertId
  }

  static async buscarPorId(id) {
    const query = `
      SELECT f.fornecedor_id,
             f.pessoa_id,
             f.cnpj,
             f.status,
             f.created_at,
             f.updated_at,
             f.created_by,
             f.updated_by,
             p.nome,
             p.status as pessoa_status,
             c.telefone,
             c.email,
             e.logradouro as endereco,
             e.numero,
             e.complemento,
             e.bairro,
             e.cidade,
             e.estado,
             e.cep,
             p_created.nome as criado_por_nome,
             p_updated.nome as atualizado_por_nome
      FROM fornecedor f
      INNER JOIN pessoa p ON f.pessoa_id = p.pessoa_id
      LEFT JOIN contato c ON p.contato_id = c.contato_id
      LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
      LEFT JOIN usuario u1 ON f.created_by = u1.usuario_id
      LEFT JOIN pessoa p_created ON u1.pessoa_id = p_created.pessoa_id
      LEFT JOIN usuario u2 ON f.updated_by = u2.usuario_id
      LEFT JOIN pessoa p_updated ON u2.pessoa_id = p_updated.pessoa_id
      WHERE f.fornecedor_id = ?
    `
    const [rows] = await pool.execute(query, [id])
    return rows[0]
  }

  static async buscarTodos(incluirInativos = false) {
    let query = `
      SELECT f.fornecedor_id,
             f.pessoa_id,
             f.cnpj,
             f.status,
             f.created_at,
             f.updated_at,
             p.nome,
             p.status as pessoa_status,
             c.telefone,
             c.email,
             e.logradouro as endereco,
             e.numero,
             e.complemento,
             e.bairro,
             e.cidade,
             e.estado,
             e.cep
      FROM fornecedor f
      INNER JOIN pessoa p ON f.pessoa_id = p.pessoa_id
      LEFT JOIN contato c ON p.contato_id = c.contato_id
      LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
    `
    if (!incluirInativos) {
      query += " WHERE f.status = true AND p.status = true"
    }
    query += " ORDER BY p.nome"

    const [rows] = await pool.execute(query)
    return rows
  }

  static async atualizar(id, fornecedor) {
    const query = `
      UPDATE fornecedor 
      SET cnpj = ?, updated_by = ?
      WHERE fornecedor_id = ?
    `
    const [result] = await pool.execute(query, [fornecedor.cnpj, fornecedor.updated_by || null, id])

    return result.affectedRows > 0
  }

  static async inativar(id) {
    const query = "UPDATE fornecedor SET status = false WHERE fornecedor_id = ?"
    const [result] = await pool.execute(query, [id])
    return result.affectedRows > 0
  }

  static async ativar(id) {
    const query = "UPDATE fornecedor SET status = true WHERE fornecedor_id = ?"
    const [result] = await pool.execute(query, [id])
    return result.affectedRows > 0
  }

  static async buscarPorCnpj(cnpj) {
    const query = "SELECT * FROM fornecedor WHERE cnpj = ?"
    const [rows] = await pool.execute(query, [cnpj])
    return rows[0]
  }

  static async buscarPorPessoaId(pessoaId) {
    const query = "SELECT * FROM fornecedor WHERE pessoa_id = ?"
    const [rows] = await pool.execute(query, [pessoaId])
    return rows[0]
  }

  static async updateStatus(id, status) {
    const query = "UPDATE fornecedor SET status = ? WHERE fornecedor_id = ?"
    const [result] = await pool.execute(query, [status, id])
    return result.affectedRows > 0
  }
}

module.exports = FornecedorModel
