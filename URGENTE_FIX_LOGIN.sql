-- EXECUTAR ESTE SQL NO phpMyAdmin URGENTE!
-- Copie e cole TUDO no phpMyAdmin → SQL → Executar

USE sroc_db;

-- Atualizar senhas com hash correto
UPDATE users 
SET password = '$2a$10$zeTTodvHJPVZMcWf0LQp9.NgPu10dZq4EhXqTJUfnJIVSGiYaj2yS' 
WHERE username IN ('admin', 'joao', 'maria');

-- Verificar
SELECT username, role, LEFT(password, 30) as pass_hash FROM users;
