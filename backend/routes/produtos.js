const express = require("express")
const { pool } = require("../config/database")
const { authorizeRole } = require("../middleware/auth")
const router = express.Router()

// Listar produtos
router.get("/", async (req, res) => {
    const query = `
        SELECT p.*, c.nome as categoria_nome, m.nome as marca_nome,
               CASE WHEN p.quantidade_estoque <= p.quantidade_minima THEN 'baixo' ELSE 'normal' END as status_estoque
        FROM peca p
        LEFT JOIN categoria c ON p.categoria_id = c.categoria_id
        LEFT JOIN marca m ON p.marca_id = m.marca_id
        WHERE p.status = TRUE
        ORDER BY p.nome
    `
    try {
        const [results] = await pool.execute(query)
        res.json(results)
    } catch (err) {
        console.error("Erro ao buscar produtos:", err)
        res.status(500).json({ error: "Erro ao buscar produtos" })
    }
})

// Criar produto (apenas admin e estoque)
router.post("/", authorizeRole(['admin', 'estoque']), async (req, res) => {
    const { nome, descricao, marca_id, preco_venda, preco_custo, quantidade_minima, categoria_id, condicao, quantidade_estoque } = req.body
    
    const query = `
        INSERT INTO peca (nome, descricao, marca_id, preco_venda, preco_custo, quantidade_estoque, quantidade_minima, categoria_id, condicao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    try {
        const [result] = await pool.execute(query, [
            nome,
            descricao,
            marca_id,
            preco_venda,
            preco_custo,
            quantidade_estoque || 0,
            quantidade_minima,
            categoria_id,
            condicao,
        ])
        res.status(201).json({ success: true, peca_id: result.insertId, message: "Produto criado com sucesso!" })
    } catch (err) {
        console.error("Erro ao criar produto:", err)
        res.status(500).json({ error: "Erro ao criar produto" })
    }
})

// Atualizar produto (apenas admin e estoque)
router.put("/:id", authorizeRole(['admin', 'estoque']), async (req, res) => {
    const { nome, descricao, marca_id, preco_venda, preco_custo, quantidade_minima, categoria_id, condicao } = req.body
    
    const query = `
        UPDATE peca SET nome = ?, descricao = ?, marca_id = ?, preco_venda = ?, preco_custo = ?,
               quantidade_minima = ?, categoria_id = ?, condicao = ?
        WHERE peca_id = ?
    `
    try {
        const [result] = await pool.execute(query, [
            nome,
            descricao,
            marca_id,
            preco_venda,
            preco_custo,
            quantidade_minima,
            categoria_id,
            condicao,
            req.params.id,
        ])
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }
        res.json({ success: true, message: "Produto atualizado com sucesso!" })
    } catch (err) {
        console.error("Erro ao atualizar produto:", err)
        res.status(500).json({ error: "Erro ao atualizar produto" })
    }
})

// Inativar produto (apenas admin)
router.delete("/:id", authorizeRole(['admin']), async (req, res) => {
    const query = "UPDATE peca SET status = FALSE WHERE peca_id = ?"
    try {
        const [result] = await pool.execute(query, [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Produto não encontrado" });
        }
        res.json({ success: true, message: "Produto inativado com sucesso!" })
    } catch (err) {
        console.error("Erro ao inativar produto:", err)
        res.status(500).json({ error: "Erro ao inativar produto" })
    }
})

// Listar categorias
router.get("/categorias/todas", async (req, res) => {
    const query = "SELECT * FROM categoria WHERE status = TRUE ORDER BY nome"
    try {
        const [results] = await pool.execute(query)
        res.json(results)
    } catch (err) {
        console.error("Erro ao buscar categorias:", err)
        res.status(500).json({ error: "Erro ao buscar categorias" })
    }
})

// Listar marcas
router.get("/marcas/todas", async (req, res) => {
    const query = "SELECT * FROM marca WHERE status = TRUE ORDER BY nome"
    try {
        const [results] = await pool.execute(query)
        res.json(results)
    } catch (err) {
        console.error("Erro ao buscar marcas:", err)
        res.status(500).json({ error: "Erro ao buscar marcas" })
    }
})

module.exports = router
