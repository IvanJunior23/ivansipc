-- Script para testar se há dados na tabela log_sistema
SELECT COUNT(*) as total_logs FROM log_sistema;

-- Verificar estrutura da tabela
DESCRIBE log_sistema;

-- Inserir alguns logs de teste se não existirem
INSERT IGNORE INTO log_sistema (usuario_id, acao, detalhes, data_hora, ip_origem) VALUES
(15, 'LOGIN', 'Usuário fez login no sistema', NOW(), '127.0.0.1'),
(15, 'CONSULTA', 'Usuário acessou página de logs', NOW(), '127.0.0.1'),
(15, 'LOGOUT', 'Usuário fez logout do sistema', NOW(), '127.0.0.1');

-- Verificar se os dados foram inseridos
SELECT * FROM log_sistema ORDER BY data_hora DESC LIMIT 10;

-- Verificar se as tabelas usuario e pessoa existem e têm dados
SELECT COUNT(*) as total_usuarios FROM usuario;
SELECT COUNT(*) as total_pessoas FROM pessoa;

-- Testar o JOIN que estava causando problema
SELECT 
    l.log_id,
    l.usuario_id,
    l.acao,
    l.detalhes,
    l.data_hora,
    p.nome as usuario_nome
FROM log_sistema l
LEFT JOIN usuario u ON l.usuario_id = u.usuario_id
LEFT JOIN pessoa p ON u.pessoa_id = p.pessoa_id
ORDER BY l.data_hora DESC 
LIMIT 5;
