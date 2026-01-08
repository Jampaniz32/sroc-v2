# SROC Backend - API e Socket.io

Backend completo do Sistema de Registo Operacional de Chamadas com:
- ✅ **API REST** (Express)
- ✅ **Chat em Tempo Real** (Socket.io)
- ✅ **Autenticação JWT**
- ✅ **Banco de Dados MySQL**

---

## 🚀 Instalação Rápida

### 1. Configurar Banco de Dados MySQL

**Opção A: MySQL Local (XAMPP/WAMP)**
1. Inicie o servidor MySQL
2. Importe o schema:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

**Opção B: Criar manualmente**
1. Abra o phpMyAdmin ou MySQL Workbench
2. Execute o arquivo `database/schema.sql`

### 2. Instalar Dependências
```bash
cd backend
npm install
```

### 3. Configurar Variáveis de Ambiente
O arquivo `.env` já está criado. **Edite apenas se necessário:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=       # Sua senha do MySQL (deixe vazio se não tiver)
DB_NAME=sroc_db
PORT=3001
```

### 4. Iniciar Servidor
```bash
npm run dev
```

O backend estará rodando em:
- **HTTP API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

---

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/change-password` - Alterar senha

### Chamadas
- `GET /api/calls` - Listar todas as chamadas
- `GET /api/calls/:id` - Buscar chamada por ID
- `POST /api/calls` - Criar nova chamada
- `PUT /api/calls/:id` - Atualizar chamada
- `DELETE /api/calls/:id` - Deletar chamada

### Usuários (Admin apenas)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Mensagens (Chat)
- `GET /api/messages` - Listar todas mensagens
- `GET /api/messages/:roomId` - Mensagens por sala

---

## 🔌 Socket.io - Eventos do Chat

### Cliente → Servidor
- `join` - Entrar numa sala
- `sendMessage` - Enviar mensagem
- `switchRoom` - Trocar de sala
- `typing` - Indicador de digitação
- `stopTyping` - Parar de digitar

### Servidor → Cliente
- `newMessage` - Nova mensagem recebida
- `activeUsers` - Lista de usuários online
- `userTyping` - Usuário está digitando
- `userStoppedTyping` - Usuário parou de digitar

---

## 👥 Usuários Padrão

Após importar o schema, você terá 3 usuários:

| Username | Senha | Papel | Agência |
|----------|-------|-------|---------|
| admin | password123 | ADMIN | Sede |
| joao | password123 | AGENTE | Sede |
| maria | password123 | AGENTE | Filial A |

---

## 🛠️ Estrutura do Projeto

```
backend/
├── config/
│   └── database.js          # Conexão MySQL
├── middleware/
│   └── auth.js              # Autenticação JWT
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── calls.js             # CRUD de chamadas
│   ├── users.js             # Gestão de usuários
│   └── messages.js          # Chat histórico
├── database/
│   └── schema.sql           # Schema do banco
├── server.js                # Servidor principal
├── .env                     # Variáveis de ambiente
└── package.json             # Dependências
```

---

## 🔐 Segurança

- Senhas hash com **bcrypt**
- Tokens JWT com expiração de 24h
- Middleware de autenticação em todas as rotas protegidas
- Validação de roles (ADMIN/AGENTE)
- CORS configurado

---

## ⚡ Próximos Passos

Depois de rodar o backend:
1. Atualizar o frontend para conectar na API
2. Integrar Socket.io no componente Chat
3. Testar o sistema completo
