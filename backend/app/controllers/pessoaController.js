const PessoaService = require("../services/pessoaService")

const PessoaController = {
  // Listar pessoas
  list: async (req, res) => {
    try {
      console.log("📋 Iniciando listagem de pessoas")

      const incluirInativos = req.query.incluirInativos === "true"
      console.log("���� Incluir inativos:", incluirInativos)

      const pessoas = await PessoaService.listarPessoasCompletas(incluirInativos)

      console.log("✅ Pessoas listadas com sucesso:", pessoas.length)

      res.json({
        success: true,
        data: pessoas,
        count: pessoas.length,
      })
    } catch (error) {
      console.error("❌ Erro ao listar pessoas:", error)
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      })
    }
  },

  // Buscar pessoa por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params
      console.log("🔍 Buscando pessoa por ID:", id)

      if (!id || isNaN(Number.parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        })
      }

      const pessoa = await PessoaService.buscarPessoaCompleta(Number.parseInt(id))

      if (!pessoa) {
        return res.status(404).json({
          success: false,
          message: "Pessoa não encontrada",
        })
      }

      console.log("✅ Pessoa encontrada:", pessoa.nome)

      res.json({
        success: true,
        data: pessoa,
      })
    } catch (error) {
      console.error("❌ Erro ao buscar pessoa:", error)
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      })
    }
  },

  // Criar pessoa
  create: async (req, res) => {
    try {
      console.log("📝 Iniciando criação de pessoa")
      console.log("📦 Dados recebidos:", JSON.stringify(req.body, null, 2))

      let dadosPessoa

      if (req.body.pessoa) {
        // Formato: { pessoa: {...}, contato: {...}, endereco: {...} }
        dadosPessoa = {
          nome: req.body.pessoa.nome,
          status: req.body.pessoa.status,
          contato_id: req.body.contato_id || null,
          endereco_id: req.body.endereco_id || null,
          contato: req.body.contato || null,
          endereco: req.body.endereco || null,
        }
      } else {
        // Formato: { nome: "...", status: ..., contato_id: ..., endereco_id: ... }
        dadosPessoa = {
          nome: req.body.nome,
          status: req.body.status,
          contato_id: req.body.contato_id || null,
          endereco_id: req.body.endereco_id || null,
          contato: req.body.contato || null,
          endereco: req.body.endereco || null,
        }
      }

      console.log("🔄 Dados processados:", JSON.stringify(dadosPessoa, null, 2))

      // Validações básicas
      const errors = []

      if (!dadosPessoa.nome || dadosPessoa.nome.trim() === "") {
        errors.push("Nome é obrigatório")
      }

      if (dadosPessoa.nome && dadosPessoa.nome.length < 2) {
        errors.push("Nome deve ter pelo menos 2 caracteres")
      }

      if (dadosPessoa.nome && dadosPessoa.nome.length > 100) {
        errors.push("Nome deve ter no máximo 100 caracteres")
      }

      // Validar contato se fornecido
      if (dadosPessoa.contato && typeof dadosPessoa.contato === "object") {
        if (dadosPessoa.contato.email && dadosPessoa.contato.email.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(dadosPessoa.contato.email)) {
            errors.push("E-mail inválido")
          }
        }

        if (dadosPessoa.contato.telefone && dadosPessoa.contato.telefone.trim() !== "") {
          const telefoneRegex = /^[\d\s$$$$\-+]+$/
          if (!telefoneRegex.test(dadosPessoa.contato.telefone)) {
            errors.push("Telefone inválido")
          }
        }

        // Se contato tem apenas campos vazios, remover
        const contatoKeys = Object.keys(dadosPessoa.contato)
        const contatoValido = contatoKeys.some(
          (key) => dadosPessoa.contato[key] && dadosPessoa.contato[key].toString().trim() !== "",
        )

        if (!contatoValido) {
          dadosPessoa.contato = null
        }
      }

      // Validar endereço se fornecido
      if (dadosPessoa.endereco && typeof dadosPessoa.endereco === "object") {
        // Se endereço tem apenas campos vazios, remover
        const enderecoKeys = Object.keys(dadosPessoa.endereco)
        const enderecoValido = enderecoKeys.some(
          (key) => dadosPessoa.endereco[key] && dadosPessoa.endereco[key].toString().trim() !== "",
        )

        if (!enderecoValido) {
          dadosPessoa.endereco = null
        }
      }

      if (errors.length > 0) {
        console.log("❌ Erros de validação:", errors)
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: errors,
        })
      }

      console.log("✅ Validações passaram, criando pessoa...")

      const pessoaId = await PessoaService.criarPessoaCompleta(dadosPessoa)

      console.log("✅ Pessoa criada com sucesso, ID:", pessoaId)

      // Buscar a pessoa criada para retornar os dados completos
      const pessoaCriada = await PessoaService.buscarPessoaCompleta(pessoaId)

      res.status(201).json({
        success: true,
        message: "Pessoa criada com sucesso",
        data: pessoaCriada,
      })
    } catch (error) {
      console.error("❌ Erro ao criar pessoa:", error)
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      })
    }
  },

  // Atualizar pessoa
  update: async (req, res) => {
    try {
      const { id } = req.params
      console.log("📝 Iniciando atualização de pessoa ID:", id)
      console.log("📦 Dados recebidos:", JSON.stringify(req.body, null, 2))

      if (!id || isNaN(Number.parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        })
      }

      let dadosPessoa

      if (req.body.pessoa) {
        // Formato: { pessoa: {...}, contato: {...}, endereco: {...} }
        dadosPessoa = {
          nome: req.body.pessoa.nome,
          status: req.body.pessoa.status,
          contato_id: req.body.contato_id || null,
          endereco_id: req.body.endereco_id || null,
          contato: req.body.contato || null,
          endereco: req.body.endereco || null,
        }
      } else {
        // Formato: { nome: "...", status: ..., contato_id: ..., endereco_id: ... }
        dadosPessoa = {
          nome: req.body.nome,
          status: req.body.status,
          contato_id: req.body.contato_id || null,
          endereco_id: req.body.endereco_id || null,
          contato: req.body.contato || null,
          endereco: req.body.endereco || null,
        }
      }

      // Validações básicas (similares ao create)
      const errors = []

      if (dadosPessoa.nome !== undefined && (!dadosPessoa.nome || dadosPessoa.nome.trim() === "")) {
        errors.push("Nome é obrigatório")
      }

      if (dadosPessoa.nome && dadosPessoa.nome.length < 2) {
        errors.push("Nome deve ter pelo menos 2 caracteres")
      }

      if (dadosPessoa.nome && dadosPessoa.nome.length > 100) {
        errors.push("Nome deve ter no máximo 100 caracteres")
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: errors,
        })
      }

      const resultado = await PessoaService.atualizarPessoaCompleta(Number.parseInt(id), dadosPessoa)

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: "Pessoa não encontrada",
        })
      }

      console.log("✅ Pessoa atualizada com sucesso")

      // Buscar a pessoa atualizada para retornar os dados completos
      const pessoaAtualizada = await PessoaService.buscarPessoaCompleta(Number.parseInt(id))

      res.json({
        success: true,
        message: "Pessoa atualizada com sucesso",
        data: pessoaAtualizada,
      })
    } catch (error) {
      console.error("❌ Erro ao atualizar pessoa:", error)
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      })
    }
  },

  // Alterar status da pessoa
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params
      const { status } = req.body

      console.log("🔄 Alterando status da pessoa ID:", id, "para:", status)

      if (!id || isNaN(Number.parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        })
      }

      if (status === undefined || status === null) {
        return res.status(400).json({
          success: false,
          message: "Status é obrigatório",
        })
      }

      const resultado = await PessoaService.alterarStatusPessoa(Number.parseInt(id), status)

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: "Pessoa não encontrada",
        })
      }

      console.log("✅ Status alterado com sucesso")

      res.json({
        success: true,
        message: "Status alterado com sucesso",
      })
    } catch (error) {
      console.error("❌ Erro ao alterar status:", error)
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      })
    }
  },

  // Excluir pessoa (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params
      console.log("🗑️ Excluindo pessoa ID:", id)

      if (!id || isNaN(Number.parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        })
      }

      const resultado = await PessoaService.excluirPessoaCompleta(Number.parseInt(id))

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: "Pessoa não encontrada",
        })
      }

      console.log("✅ Pessoa excluída com sucesso")

      res.json({
        success: true,
        message: "Pessoa excluída com sucesso",
      })
    } catch (error) {
      console.error("❌ Erro ao excluir pessoa:", error)
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      })
    }
  },
}

module.exports = PessoaController
