const express = require('express')
const router = express.Router()
const PessoaController = require('../app/controllers/pessoaController')

// Definir as rotas
router.get('/', PessoaController.list)
router.get('/:id', PessoaController.getById)
router.post('/', PessoaController.create)
router.put('/:id', PessoaController.update)
router.patch('/:id/status', PessoaController.updateStatus)  // Esta linha está causando erro
router.delete('/:id', PessoaController.delete)

module.exports = router
