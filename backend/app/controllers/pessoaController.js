// backend/app/controllers/pessoaController.js
const PessoaService = require('../services/pessoaService')

const pessoaService = new PessoaService()

const pessoaController = {
    // Listar pessoas
    async list(req, res) {
        try {
            const { page = 1, limit = 50, status, search } = req.query
            
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                search
            }

            const result = await pessoaService.getAllPessoas(filters)
            
            res.status(200).json({
                success: true,
                message: 'Pessoas listadas com sucesso',
                data: result.pessoas,
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.totalPages,
                    totalItems: result.total,
                    itemsPerPage: result.limit
                }
            })
        } catch (error) {
            console.error('Erro ao listar pessoas:', error)
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            })
        }
    },

    // Criar pessoa
    async create(req, res) {
        try {
            const { nome, status = 'ativo' } = req.body
            
            const pessoaData = {
                nome: nome.trim(),
                status,
                created_by: req.user?.id,
                created_at: new Date()
            }

            const novaPessoa = await pessoaService.createPessoa(pessoaData)
            
            res.status(201).json({
                success: true,
                message: 'Pessoa criada com sucesso',
                data: novaPessoa
            })
        } catch (error) {
            console.error('Erro ao criar pessoa:', error)
            
            if (error.message && error.message.includes('já existe')) {
                return res.status(409).json({
                    success: false,
                    message: error.message
                })
            }
            
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            })
        }
    },

    // Atualizar pessoa
    async update(req, res) {
        try {
            const { id } = req.params
            const { nome, status } = req.body
            
            const pessoaId = parseInt(id)
            if (isNaN(pessoaId) || pessoaId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                })
            }

            const updateData = {
                ...(nome && { nome: nome.trim() }),
                ...(status && { status }),
                updated_by: req.user?.id,
                updated_at: new Date()
            }

            const pessoaAtualizada = await pessoaService.updatePessoa(pessoaId, updateData)
            
            if (!pessoaAtualizada) {
                return res.status(404).json({
                    success: false,
                    message: 'Pessoa não encontrada'
                })
            }

            res.status(200).json({
                success: true,
                message: 'Pessoa atualizada com sucesso',
                data: pessoaAtualizada
            })
        } catch (error) {
            console.error('Erro ao atualizar pessoa:', error)
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            })
        }
    },

    // Alternar status
    async toggleStatus(req, res) {
        try {
            const { id } = req.params
            
            const pessoaId = parseInt(id)
            if (isNaN(pessoaId) || pessoaId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                })
            }

            const pessoa = await pessoaService.getPessoaById(pessoaId)
            if (!pessoa) {
                return res.status(404).json({
                    success: false,
                    message: 'Pessoa não encontrada'
                })
            }

            const novoStatus = pessoa.status === 'ativo' ? 'inativo' : 'ativo'
            
            const pessoaAtualizada = await pessoaService.updatePessoa(pessoaId, {
                status: novoStatus,
                updated_by: req.user?.id,
                updated_at: new Date()
            })

            res.status(200).json({
                success: true,
                message: `Status alterado para ${novoStatus}`,
                data: pessoaAtualizada
            })
        } catch (error) {
            console.error('Erro ao alterar status:', error)
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            })
        }
    }
}

module.exports = pessoaController
