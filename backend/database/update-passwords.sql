-- Atualizar senhas dos usuários padrão
-- Senha: password123 (hash bcrypt)

USE sroc_db;

UPDATE users 
SET password = '$2a$10$zeTTodvHJPVZMcWf0LQp9.NgPu10dZq4EhXqTJUfnJIVSGiYaj2yS' 
WHERE username IN ('admin', 'joao', 'maria');

SELECT username, role FROM users;
