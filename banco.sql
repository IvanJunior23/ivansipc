DROP DATABASE IF EXISTS sipc_db;

CREATE DATABASE sipc_db;

USE sipc_db;

CREATE TABLE endereco (
    endereco_id INT PRIMARY KEY AUTO_INCREMENT,
    logradouro VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep CHAR(9) NOT NULL,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE contato (
    contato_id INT PRIMARY KEY AUTO_INCREMENT,
    nome_completo VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE categoria (
    categoria_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE marca (
    marca_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE forma_pagamento (
    forma_pagamento_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE pessoa (
    pessoa_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    contato_id INT,
    endereco_id INT, -- Adicionado para relação 1:1
    status BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (contato_id) REFERENCES contato(contato_id) ON DELETE SET NULL,
    FOREIGN KEY (endereco_id) REFERENCES endereco(endereco_id) ON DELETE SET NULL -- Adicionado para relação 1:1
);

CREATE TABLE cliente (
    cliente_id INT PRIMARY KEY AUTO_INCREMENT,
    pessoa_id INT UNIQUE NOT NULL,
    cpf CHAR(14) UNIQUE NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(pessoa_id) ON DELETE CASCADE
);

CREATE TABLE fornecedor (
    fornecedor_id INT PRIMARY KEY AUTO_INCREMENT,
    pessoa_id INT UNIQUE NOT NULL,
    cnpj CHAR(18) UNIQUE NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(pessoa_id) ON DELETE CASCADE
);

CREATE TABLE usuario (
    usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    pessoa_id INT UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL COMMENT 'Armazenar como hash',
    tipo_usuario ENUM('admin', 'vendedor', 'estoque') NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(pessoa_id) ON DELETE CASCADE
);

CREATE TABLE imagem (
    imagem_id INT PRIMARY KEY AUTO_INCREMENT,
    referencia_url VARCHAR(500) NOT NULL,
    descricao VARCHAR(255),
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE peca (
    peca_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    marca_id INT,
    preco_venda DECIMAL(10,2) NOT NULL,
    preco_custo DECIMAL(10,2) NOT NULL,
    quantidade_estoque INT DEFAULT 0,
    quantidade_minima INT NOT NULL,
    categoria_id INT,
    condicao ENUM('novo', 'usado') DEFAULT 'novo',
    status BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (marca_id) REFERENCES marca(marca_id) ON DELETE SET NULL,
    FOREIGN KEY (categoria_id) REFERENCES categoria(categoria_id) ON DELETE SET NULL
);

CREATE TABLE peca_imagem (
    peca_id INT NOT NULL,
    imagem_id INT NOT NULL,
    PRIMARY KEY (peca_id, imagem_id),
    FOREIGN KEY (peca_id) REFERENCES peca(peca_id) ON DELETE CASCADE,
    FOREIGN KEY (imagem_id) REFERENCES imagem(imagem_id) ON DELETE CASCADE
);

CREATE TABLE compra (
    compra_id INT PRIMARY KEY AUTO_INCREMENT,
    fornecedor_id INT,
    usuario_id INT,
    data_compra DATE NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    status ENUM('recebida', 'pendente', 'cancelada') DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(fornecedor_id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

CREATE TABLE item_compra (
    item_compra_id INT PRIMARY KEY AUTO_INCREMENT,
    compra_id INT NOT NULL,
    peca_id INT,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compra(compra_id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES peca(peca_id) ON DELETE SET NULL
);

CREATE TABLE venda (
    venda_id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT,
    usuario_id INT,
    forma_pagamento_id INT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(12,2) NOT NULL,
    desconto_aplicado DECIMAL(10,2) DEFAULT 0,
    status ENUM('concluida', 'cancelada', 'pendente') DEFAULT 'pendente',
    FOREIGN KEY (cliente_id) REFERENCES cliente(cliente_id) ON DELETE SET NULL,
    FOREIGN KEY (forma_pagamento_id) REFERENCES forma_pagamento(forma_pagamento_id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

CREATE TABLE item_venda (
    item_venda_id INT PRIMARY KEY AUTO_INCREMENT,
    venda_id INT NOT NULL,
    peca_id INT,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    desconto_item DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (venda_id) REFERENCES venda(venda_id) ON DELETE CASCADE,
    FOREIGN KEY (peca_id) REFERENCES peca(peca_id) ON DELETE SET NULL
);

CREATE TABLE troca (
    troca_id INT PRIMARY KEY AUTO_INCREMENT,
    venda_id INT NOT NULL,
    usuario_responsavel_id INT,
    peca_trocada_id INT,
    peca_substituta_id INT,
    quantidade INT NOT NULL,
    data_troca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo_troca TEXT NOT NULL,
    FOREIGN KEY (venda_id) REFERENCES venda(venda_id) ON DELETE CASCADE,
    FOREIGN KEY (peca_trocada_id) REFERENCES peca(peca_id) ON DELETE SET NULL,
    FOREIGN KEY (peca_substituta_id) REFERENCES peca(peca_id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_responsavel_id) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

CREATE TABLE alerta (
    alerta_id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_alerta ENUM('estoque_baixo', 'venda_pendente') NOT NULL,
    peca_id INT NULL,
    venda_id INT NULL,
    usuario_responsavel_id INT,
    data_hora_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descricao TEXT NOT NULL,
    status ENUM('Ativo', 'Pendente', 'Resolvido') DEFAULT 'Ativo',
    data_hora_resolucao TIMESTAMP NULL,
    FOREIGN KEY (usuario_responsavel_id) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (peca_id) REFERENCES peca(peca_id) ON DELETE SET NULL,
    FOREIGN KEY (venda_id) REFERENCES venda(venda_id) ON DELETE SET NULL
);

CREATE TABLE movimentacao_estoque (
    movimentacao_id INT PRIMARY KEY AUTO_INCREMENT,
    peca_id INT,
    usuario_id INT,
    tipo_movimentacao ENUM('entrada_compra', 'saida_venda', 'ajuste_manual', 'devolucao_troca', 'saida_troca') NOT NULL,
    quantidade INT NOT NULL,
    quantidade_anterior INT NOT NULL,
    quantidade_nova INT NOT NULL,
    motivo VARCHAR(255),
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia_id INT,
    referencia_tipo ENUM('venda', 'compra', 'troca', 'ajuste_manual'),
    FOREIGN KEY (peca_id) REFERENCES peca(peca_id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

CREATE TABLE log_sistema (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    acao VARCHAR(255) NOT NULL,
    detalhes TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

-- TRIGGERS PARA AUTOMAÇÃO
DELIMITER //

-- Trigger para ENTRADA de estoque e LOG de movimentação após COMPRA
CREATE TRIGGER tr_compra_estoque_log
AFTER INSERT ON item_compra
FOR EACH ROW
BEGIN
    DECLARE qtd_anterior INT;
    DECLARE user_id INT;
    
    SELECT usuario_id INTO user_id FROM compra WHERE compra_id = NEW.compra_id;
    SELECT quantidade_estoque INTO qtd_anterior FROM peca WHERE peca_id = NEW.peca_id;
    
    UPDATE peca SET quantidade_estoque = quantidade_estoque + NEW.quantidade WHERE peca_id = NEW.peca_id;
    
    INSERT INTO movimentacao_estoque (peca_id, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_nova, motivo, usuario_id, referencia_id, referencia_tipo)
    VALUES (NEW.peca_id, 'entrada_compra', NEW.quantidade, qtd_anterior, qtd_anterior + NEW.quantidade, 'Compra de Mercadoria', user_id, NEW.compra_id, 'compra');
END//

-- Trigger para SAÍDA de estoque e LOG de movimentação após VENDA
CREATE TRIGGER tr_venda_estoque_log
AFTER INSERT ON item_venda
FOR EACH ROW
BEGIN
    DECLARE qtd_anterior INT;
    DECLARE user_id INT;

    SELECT usuario_id INTO user_id FROM venda WHERE venda_id = NEW.venda_id;
    SELECT quantidade_estoque INTO qtd_anterior FROM peca WHERE peca_id = NEW.peca_id;
    
    UPDATE peca SET quantidade_estoque = quantidade_estoque - NEW.quantidade WHERE peca_id = NEW.peca_id;
    
    INSERT INTO movimentacao_estoque (peca_id, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_nova, motivo, usuario_id, referencia_id, referencia_tipo)
    VALUES (NEW.peca_id, 'saida_venda', NEW.quantidade, qtd_anterior, qtd_anterior - NEW.quantidade, 'Venda de Mercadoria', user_id, NEW.venda_id, 'venda');
END//

-- Trigger para gerar ALERTA de estoque baixo
CREATE TRIGGER tr_alerta_estoque_baixo
AFTER UPDATE ON peca
FOR EACH ROW
BEGIN
    -- Gera o alerta apenas na primeira vez que o estoque cruza o limiar mínimo
    IF NEW.quantidade_estoque <= NEW.quantidade_minima AND OLD.quantidade_estoque > NEW.quantidade_minima THEN
        INSERT INTO alerta (tipo_alerta, descricao, peca_id)
        VALUES ('estoque_baixo', CONCAT('Estoque baixo para a peça: ', NEW.nome, '. Qtd atual: ', NEW.quantidade_estoque), NEW.peca_id);
    END IF;
END//

-- Trigger para gerar ALERTA de venda pendente
CREATE TRIGGER tr_alerta_venda_pendente
AFTER INSERT ON venda
FOR EACH ROW
BEGIN
    IF NEW.status = 'pendente' THEN
        INSERT INTO alerta (tipo_alerta, descricao, venda_id)
        VALUES ('venda_pendente', CONCAT('Venda pendente ID: ', NEW.venda_id, '. Valor total: R$ ', NEW.valor_total), NEW.venda_id);
    END IF;
END//

DELIMITER ;


-- Adicionar campos de auditoria nas tabelas principais
ALTER TABLE endereco ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE contato ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE categoria ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE marca ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE forma_pagamento ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE pessoa ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE cliente ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE fornecedor ADD COLUMN (
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);

ALTER TABLE peca ADD COLUMN (
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id) ON DELETE SET NULL
);


-- Expandir log_sistema para auditoria completa
ALTER TABLE log_sistema MODIFY COLUMN acao ENUM(
    'LOGIN', 'LOGOUT',
    'CREATE_CATEGORIA', 'UPDATE_CATEGORIA', 'DELETE_CATEGORIA',
    'CREATE_MARCA', 'UPDATE_MARCA', 'DELETE_MARCA',
    'CREATE_PECA', 'UPDATE_PECA', 'DELETE_PECA',
    'CREATE_CLIENTE', 'UPDATE_CLIENTE', 'DELETE_CLIENTE',
    'CREATE_FORNECEDOR', 'UPDATE_FORNECEDOR', 'DELETE_FORNECEDOR',
    'CREATE_VENDA', 'UPDATE_VENDA', 'DELETE_VENDA', 'CANCEL_VENDA',
    'CREATE_COMPRA', 'UPDATE_COMPRA', 'DELETE_COMPRA',
    'CREATE_TROCA', 'UPDATE_TROCA', 'DELETE_TROCA',
    'AJUSTE_ESTOQUE', 'CREATE_USUARIO', 'UPDATE_USUARIO', 'DELETE_USUARIO'
) NOT NULL;

ALTER TABLE log_sistema ADD COLUMN (
    tabela_afetada VARCHAR(50),
    registro_id INT,
    valores_anteriores JSON,
    valores_novos JSON,
    ip_origem VARCHAR(45)
);


DELIMITER //

-- Trigger para auditoria CATEGORIA
CREATE TRIGGER tr_audit_categoria_insert
AFTER INSERT ON categoria
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_novos)
    VALUES (NEW.created_by, 'CREATE_CATEGORIA', 'categoria', NEW.categoria_id, 
            CONCAT('Categoria criada: ', NEW.nome), 
            JSON_OBJECT('nome', NEW.nome, 'descricao', NEW.descricao, 'status', NEW.status));
END//

CREATE TRIGGER tr_audit_categoria_update
AFTER UPDATE ON categoria
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_anteriores, valores_novos)
    VALUES (NEW.updated_by, 'UPDATE_CATEGORIA', 'categoria', NEW.categoria_id,
            CONCAT('Categoria atualizada: ', NEW.nome),
            JSON_OBJECT('nome', OLD.nome, 'descricao', OLD.descricao, 'status', OLD.status),
            JSON_OBJECT('nome', NEW.nome, 'descricao', NEW.descricao, 'status', NEW.status));
END//

CREATE TRIGGER tr_audit_categoria_delete
BEFORE DELETE ON categoria
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (acao, tabela_afetada, registro_id, detalhes, valores_anteriores)
    VALUES ('DELETE_CATEGORIA', 'categoria', OLD.categoria_id,
            CONCAT('Categoria excluída: ', OLD.nome),
            JSON_OBJECT('nome', OLD.nome, 'descricao', OLD.descricao, 'status', OLD.status));
END//

-- Trigger para auditoria MARCA
CREATE TRIGGER tr_audit_marca_insert
AFTER INSERT ON marca
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_novos)
    VALUES (NEW.created_by, 'CREATE_MARCA', 'marca', NEW.marca_id,
            CONCAT('Marca criada: ', NEW.nome),
            JSON_OBJECT('nome', NEW.nome, 'descricao', NEW.descricao, 'status', NEW.status));
END//

CREATE TRIGGER tr_audit_marca_update
AFTER UPDATE ON marca
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_anteriores, valores_novos)
    VALUES (NEW.updated_by, 'UPDATE_MARCA', 'marca', NEW.marca_id,
            CONCAT('Marca atualizada: ', NEW.nome),
            JSON_OBJECT('nome', OLD.nome, 'descricao', OLD.descricao, 'status', OLD.status),
            JSON_OBJECT('nome', NEW.nome, 'descricao', NEW.descricao, 'status', NEW.status));
END//

CREATE TRIGGER tr_audit_marca_delete
BEFORE DELETE ON marca
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (acao, tabela_afetada, registro_id, detalhes, valores_anteriores)
    VALUES ('DELETE_MARCA', 'marca', OLD.marca_id,
            CONCAT('Marca excluída: ', OLD.nome),
            JSON_OBJECT('nome', OLD.nome, 'descricao', OLD.descricao, 'status', OLD.status));
END//

-- Trigger para auditoria PEÇA
CREATE TRIGGER tr_audit_peca_insert
AFTER INSERT ON peca
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_novos)
    VALUES (NEW.created_by, 'CREATE_PECA', 'peca', NEW.peca_id,
            CONCAT('Peça criada: ', NEW.nome),
            JSON_OBJECT('nome', NEW.nome, 'preco_venda', NEW.preco_venda, 'preco_custo', NEW.preco_custo, 
                       'quantidade_estoque', NEW.quantidade_estoque, 'status', NEW.status));
END//

CREATE TRIGGER tr_audit_peca_update
AFTER UPDATE ON peca
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_anteriores, valores_novos)
    VALUES (NEW.updated_by, 'UPDATE_PECA', 'peca', NEW.peca_id,
            CONCAT('Peça atualizada: ', NEW.nome),
            JSON_OBJECT('nome', OLD.nome, 'preco_venda', OLD.preco_venda, 'preco_custo', OLD.preco_custo,
                       'quantidade_estoque', OLD.quantidade_estoque, 'status', OLD.status),
            JSON_OBJECT('nome', NEW.nome, 'preco_venda', NEW.preco_venda, 'preco_custo', NEW.preco_custo,
                       'quantidade_estoque', NEW.quantidade_estoque, 'status', NEW.status));
END//

-- Trigger para auditoria VENDA
CREATE TRIGGER tr_audit_venda_insert
AFTER INSERT ON venda
FOR EACH ROW
BEGIN
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_novos)
    VALUES (NEW.usuario_id, 'CREATE_VENDA', 'venda', NEW.venda_id,
            CONCAT('Venda criada - Valor: R$ ', NEW.valor_total),
            JSON_OBJECT('cliente_id', NEW.cliente_id, 'valor_total', NEW.valor_total, 
                       'status', NEW.status, 'forma_pagamento_id', NEW.forma_pagamento_id));
END//

CREATE TRIGGER tr_audit_venda_update
AFTER UPDATE ON venda
FOR EACH ROW
BEGIN
    DECLARE acao_tipo VARCHAR(20);
    
    IF NEW.status = 'cancelada' AND OLD.status != 'cancelada' THEN
        SET acao_tipo = 'CANCEL_VENDA';
    ELSE
        SET acao_tipo = 'UPDATE_VENDA';
    END IF;
    
    INSERT INTO log_sistema (usuario_id, acao, tabela_afetada, registro_id, detalhes, valores_anteriores, valores_novos)
    VALUES (NEW.usuario_id, acao_tipo, 'venda', NEW.venda_id,
            CONCAT('Venda ', LOWER(acao_tipo), ' - ID: ', NEW.venda_id),
            JSON_OBJECT('status', OLD.status, 'valor_total', OLD.valor_total),
            JSON_OBJECT('status', NEW.status, 'valor_total', NEW.valor_total));
END//

DELIMITER ;




select * from pessoa;
select * from endereco;
select * from contato;
select * from usuario;
select * from categoria;
Select * from marca;
select * from peca;
select * from imagem;
select * from log_sistema;

SELECT COUNT(*) as total_logs FROM log_sistema;
SELECT * FROM log_sistema ORDER BY data_hora DESC LIMIT 10;



-- Adicionar colunas codigo e localizacao à tabela peca
ALTER TABLE peca 
ADD COLUMN codigo VARCHAR(50) NULL AFTER peca_id,
ADD COLUMN localizacao VARCHAR(100) NULL AFTER quantidade_minima;

-- Criar índice para busca rápida por código
CREATE INDEX idx_peca_codigo ON peca(codigo);

select * from peca;
select * from peca_imagem;
select * from forma_pagamento;
select * from imagem;
select * from fornecedor;
select * from pessoa;
select * from cliente;

INSERT INTO fornecedor (pessoa_id, cnpj)
VALUES (15, '44.855.940/0001-01');


- Criar tabela de relacionamento entre fornecedor e peça
CREATE TABLE IF NOT EXISTS fornecedor_peca (
  fornecedor_peca_id INT AUTO_INCREMENT PRIMARY KEY,
  fornecedor_id INT NOT NULL,
  peca_id INT NOT NULL,
  preco_fornecedor DECIMAL(10, 2) NULL COMMENT 'Preço que o fornecedor cobra por esta peça',
  prazo_entrega INT NULL COMMENT 'Prazo de entrega em dias',
  observacoes TEXT NULL,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  updated_by INT NULL,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(fornecedor_id),
  FOREIGN KEY (peca_id) REFERENCES peca(peca_id),
  FOREIGN KEY (created_by) REFERENCES usuario(usuario_id),
  FOREIGN KEY (updated_by) REFERENCES usuario(usuario_id),
  UNIQUE KEY unique_fornecedor_peca (fornecedor_id, peca_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar índices para melhorar performance
CREATE INDEX idx_fornecedor_peca_fornecedor ON fornecedor_peca(fornecedor_id);
CREATE INDEX idx_fornecedor_peca_peca ON fornecedor_peca(peca_id);
CREATE INDEX idx_fornecedor_peca_status ON fornecedor_peca(status);

CREATE TABLE IF NOT EXISTS historico_precos (
    historico_id INT AUTO_INCREMENT PRIMARY KEY,
    peca_id INT NOT NULL,
    fornecedor_id INT NOT NULL,
    compra_id INT,
    preco_compra DECIMAL(10, 2) NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (peca_id) REFERENCES peca(peca_id) ON DELETE CASCADE,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(fornecedor_id) ON DELETE CASCADE,
    FOREIGN KEY (compra_id) REFERENCES compra(compra_id) ON DELETE SET NULL,
    INDEX idx_peca_fornecedor (peca_id, fornecedor_id),
    INDEX idx_data_registro (data_registro)
);

ALTER TABLE peca 
ADD COLUMN fornecedor_id INT NULL,
ADD CONSTRAINT fk_peca_fornecedor 
  FOREIGN KEY (fornecedor_id) 
  REFERENCES fornecedor(fornecedor_id) 
  ON DELETE SET NULL;

-- Criar índice para melhorar performance de consultas
CREATE INDEX idx_peca_fornecedor ON peca(fornecedor_id);

-- Comentário explicativo
ALTER TABLE peca MODIFY COLUMN fornecedor_id INT NULL COMMENT 'Fornecedor preferencial da peça';


-- Verificar triggers existentes na tabela item_venda
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_STATEMENT,
    ACTION_TIMING
FROM 
    information_schema.TRIGGERS
WHERE 
    EVENT_OBJECT_TABLE = 'item_venda'
    AND TRIGGER_SCHEMA = DATABASE();

-- Remover triggers que podem estar baixando estoque automaticamente
-- (ajuste os nomes dos triggers conforme necessário)

DROP TRIGGER IF EXISTS after_item_venda_insert;
DROP TRIGGER IF EXISTS before_item_venda_insert;
DROP TRIGGER IF EXISTS item_venda_after_insert;
DROP TRIGGER IF EXISTS item_venda_before_insert;
DROP TRIGGER IF EXISTS atualizar_estoque_insert;
DROP TRIGGER IF EXISTS baixar_estoque_insert;
DROP TRIGGER IF EXISTS update_stock_on_insert;
DROP TRIGGER IF EXISTS reduce_stock_on_insert;

-- Verificar novamente se os triggers foram removidos
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE
FROM 
    information_schema.TRIGGERS
WHERE 
    EVENT_OBJECT_TABLE = 'item_venda'
    AND TRIGGER_SCHEMA = DATABASE();
    
    
-- Script para corrigir valores de estoque que foram baixados incorretamente
-- ATENÇÃO: Execute este script APENAS se você identificou vendas com baixa duplicada

-- 1. Identificar vendas que podem ter causado baixa duplicada
-- (vendas criadas hoje que estão concluídas)
SELECT 
    v.venda_id,
    v.status,
    v.data_venda,
    p.peca_id,
    p.nome as peca,
    iv.quantidade as qtd_vendida,
    p.quantidade_estoque as estoque_atual,
    (p.quantidade_estoque + iv.quantidade) as estoque_corrigido
FROM venda v
JOIN item_venda iv ON v.venda_id = iv.venda_id
JOIN peca p ON iv.peca_id = p.peca_id
WHERE v.status = 'concluida'
  AND DATE(v.data_venda) = CURDATE()
ORDER BY v.venda_id DESC;

-- 2. DESCOMENTE as linhas abaixo APENAS se você confirmar que precisa corrigir o estoque
-- Substitua {peca_id} e {quantidade} pelos valores corretos identificados acima

-- UPDATE peca 
-- SET quantidade_estoque = quantidade_estoque + {quantidade}
-- WHERE peca_id = {peca_id};

-- Exemplo:
-- UPDATE peca SET quantidade_estoque = quantidade_estoque + 1 WHERE peca_id = 123;

-- 3. Após corrigir, verificar o estoque novamente
SELECT 
    p.peca_id,
    p.nome,
    p.quantidade_estoque,
    p.quantidade_minima
FROM peca p
WHERE p.ativo = 1
ORDER BY p.nome;


-- ============================================
-- PASSO 2: CORRIGIR ESTOQUE DAS VENDAS DE HOJE
-- ============================================
-- Este script corrige o estoque das peças que foram
-- baixadas duas vezes nas vendas de hoje

-- Primeiro, vamos ver o que será corrigido
SELECT 
    p.peca_id,
    p.nome,
    p.quantidade_estoque as estoque_atual,
    SUM(iv.quantidade) as total_baixado_duplicado,
    (p.quantidade_estoque + SUM(iv.quantidade)) as estoque_corrigido
FROM venda v
JOIN item_venda iv ON v.venda_id = iv.venda_id
JOIN peca p ON iv.peca_id = p.peca_id
WHERE v.status = 'concluida'
  AND DATE(v.data_hora) = CURDATE()
GROUP BY p.peca_id, p.nome, p.quantidade_estoque;

-- Agora vamos corrigir o estoque
-- ATENÇÃO: Execute este UPDATE apenas UMA VEZ!
UPDATE peca p
JOIN (
    SELECT 
        iv.peca_id,
        SUM(iv.quantidade) as quantidade_corrigir
    FROM venda v
    JOIN item_venda iv ON v.venda_id = iv.venda_id
    WHERE v.status = 'concluida'
      AND DATE(v.data_hora) = CURDATE()
    GROUP BY iv.peca_id
) vendas ON p.peca_id = vendas.peca_id
SET p.quantidade_estoque = p.quantidade_estoque + vendas.quantidade_corrigir;

-- Verificar o resultado
SELECT 
    p.peca_id,
    p.nome,
    p.quantidade_estoque as estoque_corrigido
FROM peca p
WHERE p.peca_id IN (
    SELECT DISTINCT iv.peca_id
    FROM venda v
    JOIN item_venda iv ON v.venda_id = iv.venda_id
    WHERE v.status = 'concluida'
      AND DATE(v.data_hora) = CURDATE()
);
