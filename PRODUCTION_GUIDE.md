# Guia de Deploy para Produção - SROC v2.0

Este guia descreve os passos para colocar o sistema SROC v2.0 em produção, servindo o frontend otimizado através do backend Node.js.

## 1. Pré-requisitos
- Node.js (v18+) instalado.
- Banco de dados MySQL configurado e rodando.
- Variáveis de ambiente configuradas no arquivo `backend/.env`.

## 2. Preparação do Build (Frontend)
O frontend deve ser compilado para arquivos estáticos otimizados.

1. Navegue para a pasta raiz do projeto:
   ```bash
   cd c:\Users\jpira\Downloads\Sistema-de-registro-de-chamadas-main\Sistema-de-registro-de-chamadas-main
   ```
2. Instale as dependências (se ainda não o fez):
   ```bash
   npm install
   ```
3. Execute o build de produção:
   ```bash
   npm run build
   ```
   > Isso criará uma pasta `dist` com os arquivos HTML, CSS e JS otimizados.

## 3. Configuração do Backend
O backend foi configurado para servir automaticamente os arquivos da pasta `dist` quando rodar em modo de produção.

1. Navegue para a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências de produção:
   ```bash
   npm install --production
   ```
3. Verifique o arquivo `.env` e certifique-se de que a variável `NODE_ENV` está definida (ou defina na execução):
   ```env
   NODE_ENV=production
   PORT=3001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=sroc_db
   JWT_SECRET=seu_segredo_super_seguro
   ```

## 4. Iniciar em Produção
Para iniciar o servidor servindo a aplicação completa:

### Windows (PowerShell)
```powershell
$env:NODE_ENV="production"; node server.js
```
Ou simplesmente:
```powershell
npm start
```
(Certifique-se de definir `NODE_ENV=production` no seu ambiente ou no `.env`)

### Linux/Mac
```bash
NODE_ENV=production node server.js
```

## 5. Como Aceder
Após iniciar, o sistema estará disponível em:
- **URL:** `http://localhost:3001` (ou o IP do servidor)
- O backend servirá tanto a API (`/api/*`) quanto a interface do React.

## 6. Solução de Problemas
- **Erro EADDRINUSE**: Se a porta 3001 estiver ocupada, pare qualquer outro processo node/nodemon rodando essa porta.
- **Tela Branca**: Verifique se a pasta `dist` foi criada corretamente na raiz do projeto.
- **Configurações**: As configurações e uploads (logótipos) são salvos na pasta `backend/uploads` ou no banco, certifique-se de que as permissões de escrita estão corretas.
