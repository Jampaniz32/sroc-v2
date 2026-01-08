# 🚀 SROC - Sistema de Registo Operacional de Chamadas

Sistema completo de gestão de chamadas operacionais com **chat em tempo real**, desenvolvido com React + Node.js + MySQL + Socket.io.

---

## ✨ Funcionalidades

### 👤 Autenticação
- ✅ Login seguro com JWT
- ✅ Gestão de permissões (ADMIN / AGENTE)
- ✅ Sessões persistentes

### 📞 Gestão de Chamadas
- ✅ Criar registos de chamadas
- ✅ Listar histórico completo
- ✅ Editar e deletar registos
- ✅ Filtros avançados
- ✅ Exportação (Excel/CSV)
- ✅ Dashboard com estatísticas

### 💬 Chat em Tempo Real
- ✅ Mensagens instantâneas (Socket.io)
- ✅ Salas (global + privadas)
- ✅ Indicador de digitação
- ✅ Usuários online
- ✅ Notificações push
- ✅ Persistência no banco

### ⚙️ Configurações (Admin)
- ✅ Gestão de usuários
- ✅ Personalização do sistema
- ✅ Campos customizáveis
- ✅ Configurações de backup

---

## 🛠️ Tecnologias

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Socket.io Client

### Backend
- Node.js
- Express
- Socket.io
- MySQL
- JWT + bcrypt
- Dotenv

---

## 📦 Instalação Completa

### **Pré-requisitos**
- Node.js 14+ ([Download](https://nodejs.org/))
- MySQL ([XAMPP](https://www.apachefriends.org/) recomendado)

---

### **1. Clonar Repositório**
```bash
git clone [seu-repo]
cd Sistema-de-registro-de-chamadas
```

---

### **2. Instalar MySQL**

**Opção A: XAMPP (Mais Fácil)**
1. Baixe: https://www.apachefriends.org/download.html
2. Instale e inicie MySQL
3. Abra phpMyAdmin: http://localhost/phpmyadmin
4. Vá em SQL e execute: `backend/database/schema.sql`

**Opção B: MySQL Standalone**
```bash
mysql -u root -p < backend/database/schema.sql
```

Veja guia detalhado: `backend/MYSQL_SETUP.md`

---

### **3. Configurar Backend**

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env (já está criado, apenas verifique)
# Edite backend/.env se necessário:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=       # Sua senha do MySQL
DB_NAME=sroc_db
PORT=3001

# Iniciar servidor
npm run dev
```

Deve aparecer:
```
✅ Database connected successfully
🚀 SROC Backend Server
📡 HTTP API: http://localhost:3001
```

---

### **4. Configurar Frontend**

```bash
# Volte para a raiz do projeto
cd ..

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

Deve aparecer:
```
VITE ready in 255 ms
➜  Local:   http://localhost:3000/
```

---

### **5. Acessar Sistema**

1. Abra: http://localhost:3000
2. **Login padrão**: `admin` / `password123`
3. Explore! 🎉

---

## 👥 Usuários Padrão

| Username | Senha | Papel |
|----------|-------|-------|
| admin | password123 | ADMIN |
| joao | password123 | AGENTE |
| maria | password123 | AGENTE |

---

## 📡 Arquitetura

```
┌─────────────────┐
│  Frontend       │  React + Vite (Port 3000)
│  localhost:3000 │
└────────┬────────┘
         │
         │ HTTP + WebSocket
         │
┌────────▼────────┐
│  Backend        │  Express + Socket.io (Port 3001)
│  localhost:3001 │
└────────┬────────┘
         │
         │ MySQL
         │
┌────────▼────────┐
│  Database       │  MySQL (Port 3306)
│  sroc_db        │
└─────────────────┘
```

---

## 🧪 Testar Chat em Tempo Real

1. Abra **2 navegadores** (ou janela anônima)
2. **Navegador 1**: Login com `admin`
3. **Navegador 2**: Login com `joao`
4. Em ambos, vá em "Comunicação" (Chat)
5. **Envie mensagem de um navegador**
6. **Aparece INSTANTANEAMENTE no outro!** 🎊

---

## 📂 Estrutura do Projeto

```
Sistema-de-registro-de-chamadas/
├── backend/                      # Backend Node.js
│   ├── config/
│   │   └── database.js           # Conexão MySQL
│   ├── routes/
│   │   ├── auth.js               # Autenticação
│   │   ├── calls.js              # CRUD Chamadas
│   │   ├── users.js              # Gestão Usuários
│   │   └── messages.js           # Chat
│   ├── middleware/
│   │   └── auth.js               # JWT Middleware
│   ├── database/
│   │   └── schema.sql            # Schema MySQL
│   ├── server.js                 # Servidor Principal
│   ├── .env                      # Configurações
│   └── package.json
│
├── components/                   # Componentes React
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── CallForm.tsx
│   ├── CallList.tsx
│   ├── Chat.tsx                  # Chat tempo real
│   ├── Settings.tsx
│   └── ...
│
├── services/                     # Integrações
│   ├── api.ts                    # Axios API client
│   └── socket.ts                 # Socket.io client
│
├── App.tsx                       # App principal
├── index.tsx                     # Entry point
├── types.ts                      # TypeScript types
├── utils.ts                      # Utilities
├── .env                          # Config frontend
└── package.json
```

---

## 📖 Documentação Adicional

- **Backend**: `backend/README.md`
- **MySQL Setup**: `backend/MYSQL_SETUP.md`
- **Integração**: `FRONTEND_BACKEND_INTEGRATION.md`
- **Implementação**: `backend/IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Deploy (Produção)

### Vercel (Frontend + Backend)
```bash
# Já está pronto para deploy!
# Consulte o histórico de conversas para instruções de deploy
```

### Banco de Dados - Aiven
- Crie banco MySQL gratuito em: https://aiven.io
- Atualize variáveis de ambiente

---

## 🐛 Troubleshooting

### ❌ Erro ao conectar MySQL
```bash
# Verifique se MySQL está rodando
# XAMPP: Inicie o serviço MySQL
# Verifique backend/.env
```

### ❌ Chat não funciona
```bash
# 1. Verifique se backend está rodando na porta 3001
# 2. Veja console do navegador: deve ter "✅ Socket connected"
# 3. Limpe localStorage e faça login novamente
```

### ❌ "Cannot find module"
```bash
# Reinstale dependências
npm install
cd backend && npm install
```

---

## 🔐 Segurança

- ✅ Senhas criptografadas (bcrypt)
- ✅ JWT com expiração (24h)
- ✅ SQL injection protection
- ✅ CORS configurado
- ✅ Variáveis de ambiente
- ✅ .env no .gitignore

---

## 📝 Licença

Este projeto foi desenvolvido para uso interno/educacional.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação em:
- `backend/README.md`
- `FRONTEND_BACKEND_INTEGRATION.md`

---

Desenvolvido com ❤️ usando React + Node.js + Socket.io
