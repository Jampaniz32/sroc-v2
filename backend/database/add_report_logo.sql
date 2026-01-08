-- Adicionar coluna report_logo na tabela system_config

-- Primeiro, criar tabela system_config se não existir
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_logo LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Se a tabela já existe, apenas adicionar a coluna
ALTER TABLE system_config 
ADD COLUMN IF NOT EXISTS report_logo LONGTEXT NULL;
