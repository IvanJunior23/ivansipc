const fs = require("fs")
const path = require("path")

// Função para atualizar os caminhos dos assets em um arquivo HTML
function updateAssetPaths(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8")

    // Substituir todos os caminhos de assets
    content = content.replace(/href="assets\//g, 'href="../assets/')
    content = content.replace(/src="assets\//g, 'src="../assets/')

    // Escrever o arquivo atualizado
    fs.writeFileSync(filePath, content, "utf8")
    console.log(`✅ Atualizado: ${filePath}`)
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${filePath}:`, error.message)
  }
}

// Lista de arquivos HTML na pasta View que precisam ser atualizados
const htmlFiles = [
  "frontend/View/alertas.html",
  "frontend/View/categorias.html",
  "frontend/View/clientes.html",
  "frontend/View/compras.html",
  "frontend/View/contatos.html",
  "frontend/View/enderecos.html",
  "frontend/View/faq.html",
  "frontend/View/formas-pagamento.html",
  "frontend/View/fornecedores.html",
  "frontend/View/logs.html",
  "frontend/View/marcas.html",
  "frontend/View/pecas.html",
  "frontend/View/pessoas.html",
  "frontend/View/recuperar-senha.html",
  "frontend/View/relatorios.html",
  "frontend/View/template-page.html",
  "frontend/View/trocas.html",
  "frontend/View/usuarios.html",
  "frontend/View/vendas.html",
]

console.log("🔄 Iniciando atualização dos caminhos dos assets...")

// Atualizar cada arquivo
htmlFiles.forEach((file) => {
  const fullPath = path.join(__dirname, "..", file)
  if (fs.existsSync(fullPath)) {
    updateAssetPaths(fullPath)
  } else {
    console.warn(`⚠️  Arquivo não encontrado: ${fullPath}`)
  }
})

console.log("✅ Atualização concluída!")
console.log('📁 Todos os arquivos HTML na pasta View agora usam "../assets/" para referenciar CSS e JS')
