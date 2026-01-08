-- SROC Database Schema
-- Sistema de Registo Operacional de Chamadas

-- CREATE DATABASE IF NOT EXISTS sroc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE sroc_db;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'AGENTE',
    agency VARCHAR(255),
    require_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Chamadas
CREATE TABLE IF NOT EXISTS calls (
    id VARCHAR(36) PRIMARY KEY,
    nuit VARCHAR(50),
    cliente VARCHAR(255) NOT NULL,
    entidade VARCHAR(255) NOT NULL,
    agencia VARCHAR(255),
    tipo_pedido VARCHAR(255) NOT NULL,
    estagio VARCHAR(255) NOT NULL DEFAULT 'Aberto',
    contacto VARCHAR(50),
    whatsapp VARCHAR(50),
    observacoes TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    turno VARCHAR(255) NOT NULL,
    agente_id VARCHAR(36) NOT NULL,
    agente_nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agente_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_agente (agente_id),
    INDEX idx_estagio (estagio),
    INDEX idx_data (data),
    INDEX idx_entidade (entidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Mensagens (Chat)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    room_id VARCHAR(100) NOT NULL DEFAULT 'global',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_room (room_id),
    INDEX idx_sender (sender_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    institution_name VARCHAR(255) DEFAULT 'SROC Operacional',
    report_logo LONGTEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuários padrão (senha: password123)
-- Hash bcrypt gerado com bcryptjs
INSERT INTO users (id, name, username, password, role, agency) VALUES
('1', 'Administrador Principal', 'admin', '$2a$10$zeTTodvHJPVZMcWf0LQp9.NgPu10dZq4EhXqTJUfnJIVSGiYaj2yS', 'ADMIN', 'Sede'),
('2', 'Agente João', 'joao', '$2a$10$zeTTodvHJPVZMcWf0LQp9.NgPu10dZq4EhXqTJUfnJIVSGiYaj2yS', 'AGENTE', 'Sede'),
('3', 'Agente Maria', 'maria', '$2a$10$zeTTodvHJPVZMcWf0LQp9.NgPu10dZq4EhXqTJUfnJIVSGiYaj2yS', 'AGENTE', 'Filial A');

-- Inserir configuração padrão
INSERT INTO system_config (id, institution_name) VALUES (1, 'SROC Operacional');
