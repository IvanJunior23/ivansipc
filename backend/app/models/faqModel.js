const { pool } = require("../../config/database")

class FaqModel {
  // Buscar todas as perguntas frequentes ativas
  static async getAll() {
    const query = `
      SELECT faq_id, pergunta, resposta, categoria, ordem, data_criacao, data_atualizacao
      FROM faq 
      WHERE status = TRUE 
      ORDER BY categoria, ordem ASC, pergunta ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results
    } catch (error) {
      throw new Error(`Erro ao buscar FAQs: ${error.message}`)
    }
  }

  // Buscar FAQ por ID
  static async getById(id) {
    const query = `
      SELECT faq_id, pergunta, resposta, categoria, ordem, status, data_criacao, data_atualizacao
      FROM faq 
      WHERE faq_id = ?
    `

    try {
      const [results] = await pool.execute(query, [id])
      return results[0] || null
    } catch (error) {
      throw new Error(`Erro ao buscar FAQ: ${error.message}`)
    }
  }

  // Buscar FAQs por categoria
  static async getByCategoria(categoria) {
    const query = `
      SELECT faq_id, pergunta, resposta, categoria, ordem, data_criacao, data_atualizacao
      FROM faq 
      WHERE categoria = ? AND status = TRUE 
      ORDER BY ordem ASC, pergunta ASC
    `

    try {
      const [results] = await pool.execute(query, [categoria])
      return results
    } catch (error) {
      throw new Error(`Erro ao buscar FAQs por categoria: ${error.message}`)
    }
  }

  // Criar novo FAQ
  static async create(faqData) {
    const { pergunta, resposta, categoria, ordem = 0 } = faqData
    const query = `
      INSERT INTO faq (pergunta, resposta, categoria, ordem, status, data_criacao, data_atualizacao)
      VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
    `

    try {
      const [result] = await pool.execute(query, [pergunta, resposta, categoria, ordem])
      return result.insertId
    } catch (error) {
      throw new Error(`Erro ao criar FAQ: ${error.message}`)
    }
  }

  // Atualizar FAQ
  static async update(id, faqData) {
    const { pergunta, resposta, categoria, ordem, status } = faqData
    const query = `
      UPDATE faq 
      SET pergunta = ?, resposta = ?, categoria = ?, ordem = ?, status = ?, data_atualizacao = NOW()
      WHERE faq_id = ?
    `

    try {
      const [result] = await pool.execute(query, [pergunta, resposta, categoria, ordem, status, id])
      return result.affectedRows > 0
    } catch (error) {
      throw new Error(`Erro ao atualizar FAQ: ${error.message}`)
    }
  }

  // Deletar FAQ (soft delete)
  static async delete(id) {
    const query = `UPDATE faq SET status = FALSE, data_atualizacao = NOW() WHERE faq_id = ?`

    try {
      const [result] = await pool.execute(query, [id])
      return result.affectedRows > 0
    } catch (error) {
      throw new Error(`Erro ao deletar FAQ: ${error.message}`)
    }
  }

  // Buscar categorias disponíveis
  static async getCategorias() {
    const query = `
      SELECT DISTINCT categoria 
      FROM faq 
      WHERE status = TRUE 
      ORDER BY categoria ASC
    `

    try {
      const [results] = await pool.execute(query)
      return results.map((row) => row.categoria)
    } catch (error) {
      throw new Error(`Erro ao buscar categorias: ${error.message}`)
    }
  }
}

module.exports = FaqModel
