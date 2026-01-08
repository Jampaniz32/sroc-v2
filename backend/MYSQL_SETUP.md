# 🗄️ Guia de Instalação do MySQL

Escolha uma das opções abaixo para instalar o MySQL.

---

## Opção 1: XAMPP (Recomendado - Mais Fácil)

### Windows
1. **Download**: [https://www.apachefriends.org/download.html](https://www.apachefriends.org/download.html)
2. Instale o XAMPP
3. Abra o **XAMPP Control Panel**
4. Clique em **Start** ao lado de MySQL
5. Clique em **Admin** para abrir o phpMyAdmin
6. Vá em **SQL** e cole o conteúdo do arquivo `backend/database/schema.sql`
7. Clique em **Executar**

✅ **Pronto!** O banco de dados está criado.

---

## Opção 2: MySQL Standalone

### Windows
1. **Download**: [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)
2. Escolha "MySQL Installer for Windows"
3. Durante a instalação:
   - Escolha "Developer Default"
   - Configure uma senha para o usuário `root` (ou deixe em branco)
4. Após a instalação, abra o **MySQL Workbench**
5. Conecte com `localhost` usando usuário `root`
6. Crie um novo Query Tab e execute o arquivo `backend/database/schema.sql`

---

## Opção 3: Via Linha de Comando

Se já tem MySQL instalado:

```bash
# Conectar ao MySQL
mysql -u root -p

# Dentro do MySQL, execute:
source C:/Users/jpira/.gemini/antigravity/scratch/sroc/Sistema-de-registro-de-chamadas/backend/database/schema.sql

# Verificar se foi criado
SHOW DATABASES;
USE sroc_db;
SHOW TABLES;
```

---

## ✅ Verificar Instalação

Após qualquer método acima:

1. Abra o phpMyAdmin ou MySQL Workbench
2. Verifique se o banco `sroc_db` foi criado
3. Deve ter 4 tabelas:
   - `users` (3 usuários padrão)
   - `calls`
   - `messages`
   - `system_config`

---

## 🔧 Configuração do .env

Depois de instalar, verifique o arquivo `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        # Coloque sua senha aqui (ou vazio)
DB_NAME=sroc_db
DB_PORT=3306
```

---

## 🚀 Iniciar Backend

```bash
cd backend
npm run dev
```

Se aparecer:
```
✅ Database connected successfully
🚀 SROC Backend Server
📡 HTTP API: http://localhost:3001
```

**SUCESSO!** 🎉
