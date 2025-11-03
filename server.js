// Local: sipc/server.js

const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

// Adicione TEMPORARIAMENTE no início do server.js, após require("dotenv").config()
console.log("🔍 Verificando variáveis de ambiente:")
console.log("SMTP_HOST:", process.env.SMTP_HOST)
console.log("SMTP_PORT:", process.env.SMTP_PORT)
console.log("SMTP_USER:", process.env.SMTP_USER)
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "***configurado***" : "NÃO CONFIGURADO")
console.log("SMTP_FROM:", process.env.SMTP_FROM)
console.log("---")

// --- 1. Conexão com o Banco e Configurações Iniciais ---
const { testConnection } = require("./backend/config/database")
testConnection()

const app = express()
const PORT = process.env.PORT || 3000

// --- 2. Middlewares Essenciais ---
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// --- 3. SERVIR ARQUIVOS DO FRONTEND ---
app.use(express.static(path.join(__dirname, "frontend")))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// --- 4. Registrar TODAS as rotas da API ---
const authRoutes = require("./backend/routes/auth")
const usuarioRoutes = require("./backend/routes/usuarios")
const clienteRoutes = require("./backend/routes/clientes")
const produtoRoutes = require("./backend/routes/produtos")
const estoqueRoutes = require("./backend/routes/estoque")
const fornecedorRoutes = require("./backend/routes/fornecedores")
const vendaRoutes = require("./backend/routes/vendas")
const relatorioRoutes = require("./backend/routes/relatorios")
const contatoRoutes = require("./backend/routes/contatos")
const enderecoRoutes = require("./backend/routes/enderecos")
const categoriaRoutes = require("./backend/routes/categorias")
const marcaRoutes = require("./backend/routes/marcas")
const formaPagamentoRoutes = require("./backend/routes/formas-pagamento")
const pecaRoutes = require("./backend/routes/pecas")
const compraRoutes = require("./backend/routes/compras")
const trocaRoutes = require("./backend/routes/trocas")
const alertaRoutes = require("./backend/routes/alertas")
const faqRoutes = require("./backend/routes/faq")
const dashboardRoutes = require("./backend/routes/dashboard")
const testRoutes = require("./backend/routes/testRoutes")
const LogsRoutes = require("./backend/routes/logs")
const passwordResetRoutes = require("./backend/routes/passwordReset")
const pessoasRoutes = require("./backend/routes/pessoas")
const imagemRoutes = require("./backend/routes/imagens")
const historicoPrecoRoutes = require("./backend/routes/historicoPrecos")

app.use("/api/auth", authRoutes)
app.use("/api/usuarios", usuarioRoutes)
app.use("/api/clientes", clienteRoutes)
app.use("/api/produtos", produtoRoutes)
app.use("/api/estoque", estoqueRoutes)
app.use("/api/fornecedores", fornecedorRoutes)
app.use("/api/vendas", vendaRoutes)
app.use("/api/relatorios", relatorioRoutes)
app.use("/api/contatos", contatoRoutes)
app.use("/api/enderecos", enderecoRoutes)
app.use("/api/categorias", categoriaRoutes)
app.use("/api/marcas", marcaRoutes)
app.use("/api/formas-pagamento", formaPagamentoRoutes)
app.use("/api/pecas", pecaRoutes)
app.use("/api/compras", compraRoutes)
app.use("/api/trocas", trocaRoutes)
app.use("/api/alertas", alertaRoutes)
app.use("/api/faq", faqRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/test", testRoutes)
app.use("/api/logs", LogsRoutes)
app.use("/api/password", passwordResetRoutes)
app.use("/api/pessoas", pessoasRoutes)
app.use("/api/imagens", imagemRoutes)
app.use("/api/historico-precos", historicoPrecoRoutes)

// --- 5. Rota Principal e Tratamento de Erros ---
// Rota para servir a página de login como a página principal do site
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "View", "login.html"))
})

app.get("/recuperar-senha.html", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "View", "recuperar-senha.html"))
})

// Middleware para rotas não encontradas na API
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint da API não encontrado" })
})

// Middleware de tratamento de erros global (para erros 500 no backend)
app.use((err, req, res, next) => {
  console.error("❌ Erro inesperado no servidor:", err)
  res.status(500).json({
    success: false,
    message: "Ocorreu um erro interno no servidor.",
  })
})

// --- 6. Iniciar o Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com sucesso em http://localhost:${PORT}`)
})
