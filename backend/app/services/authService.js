// backend/app/services/authService.js
const userModel = require("../models/userModel")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../../config/jwt")
const jwtDebugger = require("../../utils/jwtDebugger")

const login = async (email, senha) => {
  console.log("🔐 AuthService.login iniciado:", email);
  
  try {
    // 1. Encontra o usuário pelo e-mail
    console.log("📋 Buscando usuário por email:", email);
    const user = await userModel.findByEmail(email);
    console.log("👤 Resultado da busca:", user ? "ENCONTRADO" : "NÃO ENCONTRADO");
    
    if (user) {
      console.log("📄 Dados do usuário:", {
        usuario_id: user.usuario_id,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        status: user.status,
        temSenha: !!user.senha,
        senhaLength: user.senha?.length,
        senhaInicia: user.senha?.substring(0, 10) + "..."
      });
    }
    
    if (!user) {
      console.log("❌ Usuário não encontrado para email:", email);
      throw new Error("Credenciais inválidas");
    }
    
    // 2. Verifica se o usuário está ativo
    console.log("✅ Verificando status do usuário:", user.status);
    if (!user.status) {
      console.log("❌ Usuário inativo:", email);
      throw new Error("Este usuário está inativo.");
    }
    
    // 3. Compara a senha - MELHORADO
    console.log("🔒 Verificando senha...");
    console.log("Senha digitada:", senha);
    console.log("Hash no banco (primeiros 20 chars):", user.senha?.substring(0, 20) + "...");
    
    let senhaValida = false;
    
    // Verificar se é hash bcrypt
    if (user.senha && user.senha.startsWith('$2')) {
      console.log("🔐 Usando verificação bcrypt");
      senhaValida = await bcrypt.compare(senha, user.senha);
    } else {
      console.log("🔓 Usando comparação simples (texto plano)");
      senhaValida = (senha === user.senha);
    }
    
    console.log("🔑 Resultado da verificação de senha:", senhaValida);
    
    if (!senhaValida) {
      console.log("❌ Senha inválida para:", email);
      throw new Error("Credenciais inválidas");
    }
    
    console.log("✅ Login validado com sucesso!");
    
    // 4. Se tudo estiver correto, cria o "payload" para o token
    const payload = {
      id: user.usuario_id,
      nome: user.nome,
      tipo_usuario: user.tipo_usuario,
    };
    
    try {
      // 5. Gera o token JWT com debugging completo
      const token = jwtDebugger.debugTokenGeneration(payload, { expiresIn: JWT_EXPIRES_IN });
      
      // Verify token immediately after generation
      const decoded = jwtDebugger.debugTokenVerification(token, JWT_SECRET);
      
      console.log("✅ Token gerado e validado com sucesso!");
      
      // 6. Prepara o objeto de usuário para retornar ao frontend (sem a senha)
      const userResponse = {
        usuario_id: user.usuario_id,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
      };
      
      return { token, user: userResponse };
      
    } catch (error) {
      jwtDebugger.log("ERROR", "Login process failed", {
        userId: user.usuario_id,
        error: error.message,
        stack: error.stack,
      });
      throw new Error("Erro interno na geração do token");
    }
    
  } catch (error) {
    console.error("❌ Erro completo no login:", error);
    throw error;
  }
};

const changePassword = async (userId, senhaAtual, novaSenha) => {
  // 1. Encontra o usuário pelo ID
  const user = await userModel.findById(userId)
  if (!user) {
    throw new Error("Usuário não encontrado")
  }

  // 2. Verifica se o usuário está ativo
  if (!user.status) {
    throw new Error("Este usuário está inativo.")
  }

  // 3. Busca a senha atual do banco para comparação
  const userWithPassword = await userModel.findByEmail(user.email)
  if (!userWithPassword) {
    throw new Error("Erro ao verificar credenciais")
  }

  // 4. Verifica se a senha atual está correta
  const senhaAtualValida = await bcrypt.compare(senhaAtual, userWithPassword.senha)
  if (!senhaAtualValida) {
    throw new Error("Senha atual incorreta")
  }

  // 5. Verifica se a nova senha é diferente da atual
  const novaSenhaIgualAtual = await bcrypt.compare(novaSenha, userWithPassword.senha)
  if (novaSenhaIgualAtual) {
    throw new Error("A nova senha deve ser diferente da senha atual")
  }

  // 6. Criptografa a nova senha
  const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10)

  // 7. Atualiza a senha no banco de dados
  await userModel.update(userId, { senhaCriptografada: novaSenhaCriptografada })

  return { message: "Senha alterada com sucesso" }
}

module.exports = { login, changePassword }
