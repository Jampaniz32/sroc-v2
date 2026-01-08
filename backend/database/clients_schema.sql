-- SROC Clients Table Schema
-- Tabela para armazenar clientes únicos identificados por NUIT

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(36) PRIMARY KEY,
    nuit VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    entidade VARCHAR(255),
    agencia VARCHAR(255),
    contacto VARCHAR(50),
    whatsapp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nuit (nuit),
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar clientes existentes da tabela calls (sem duplicar NUITs)
INSERT IGNORE INTO clients (id, nuit, nome, entidade, agencia, contacto, whatsapp, created_at)
SELECT 
    UUID() as id,
    c.nuit,
    c.cliente as nome,
    c.entidade,
    c.agencia,
    c.contacto,
    c.whatsapp,
    MIN(c.created_at) as created_at
FROM calls c
WHERE c.nuit IS NOT NULL AND c.nuit != ''
GROUP BY c.nuit, c.cliente, c.entidade, c.agencia, c.contacto, c.whatsapp;
