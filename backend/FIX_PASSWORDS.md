# 🔧 Atualizar Senhas dos Usuários

## ❌ Problema Identificado
As senhas no banco de dados estavam com hash incorreto. O login falha com erro 401.

## ✅ Solução

### Opção 1: Via phpMyAdmin (MAIS FÁCIL)

1. Abra: **http://localhost/phpmyadmin**
2. Clique no banco `sroc_db` (lado esquerdo)
3. Clique na aba **SQL** (no topo)
4. Copie e cole este comando:

```sql
UPDATE users 
SET password = '$2a$10$zeTTodvHJPVZMcWf0LQp9.NgPu10dZq4EhXqTJUfnJIVSGiYaj2yS' 
WHERE username IN ('admin', 'joao', 'maria');
```

5. Clique em **Executar**
6. Deve aparecer: "3 rows affected"

### Opção 2: Via Linha de Comando

```bash
mysql -u root -p sroc_db < backend/database/update-passwords.sql
```

---

## ✅ Verificar

Para confirmar que funcionou:

1. No phpMyAdmin, execute:
```sql
SELECT username, role, LEFT(password, 20) as password_hash FROM users;
```

2. Você deve ver:
```
admin  | ADMIN  | $2a$10$zeTTodvHJPV...
joao   | AGENTE | $2a$10$zeTTodvHJPV...
maria  | AGENTE | $2a$10$zeTTodvHJPV...
```

---

## 🎯 Depois de Atualizar

Volte ao navegador e tente fazer login novamente:
- **Username**: `admin`
- **Password**: `password123`

Deve funcionar! ✨

---

## 📝 Nota
Este arquivo foi criado porque o hash bcrypt no schema.sql original estava incorreto. 
Agora o `schema.sql` já foi corrigido também.
