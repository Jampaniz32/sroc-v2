# Guia de Deploy - SROC (Sistema de Registo Operacional de Chamadas)

Para colocar o sistema online, utilizaremos uma arquitetura híbrida, pois o Vercel é excelente para o Frontend mas não suporta WebSockets (Chat) ou Bancos de Dados persistentes.

## Arquitetura Recomendada
1.  **Frontend**: Vercel (Gratuito/Rápido)
2.  **Backend (API + Chat)**: Railway.app ou Render.com (Suporta WebSockets e processos contínuos)
3.  **Banco de Dados**: Railway (MySQL) ou Aiven.io

---

## Passo 1: Preparar o Banco de Dados (Railway)
1.  Crie uma conta em [Railway.app](https://railway.app/).
2.  Clique em **+ New Project** > **Provision MySQL**.
3.  Aguarde a criação. Clique no serviço **MySQL** que apareceu no painel.
4.  Vá na aba **Variables** e copie os valores ou vá em **Connect** para ver a String de Conexão.

### Como Importar o Esquema (`schema.sql`):
Existem 3 formas simples. Escolha a que preferir:

**Opção A: Via Terminal (Mais rápido se tiver o MySQL instalado localmente)**
Abra o terminal na pasta do projeto e execute:
```bash
mysql -h [HOST] -u [USER] -p[PASSWORD] -P [PORT] [DATABASE] < backend/database/schema.sql
```
*(Substitua os termos em colchetes pelos dados que o Railway forneceu na aba "Connect")*

**Opção B: Via Interface do Railway (Sem instalar nada)**
1. Clique no serviço MySQL no Railway.
2. Vá na aba **Data**.
3. No topo ou lateral, verá um botão chamado **"SQL Canvas"** ou um editor de texto para comandos SQL.
4. Abra o arquivo `backend/database/schema.sql` no seu VS Code, copie todo o texto (Ctrl+A, Ctrl+C).
5. Cole no editor do Railway e clique em **Run Query**.

**Opção C: Via Ferramenta Gráfica (Recomendado: DBeaver ou HeidiSQL)**
1. Copie a **URL de Conexão** da aba "Connect" do Railway.
2. No seu programa (ex: DBeaver), crie uma nova conexão MySQL e cole a URL.
3. Clique com o botão direito no banco de dados > **Execute SQL Script** e selecione o `backend/database/schema.sql`.

## Passo 2: Deploy do Backend (Railway/Render)
1.  Suba apenas a pasta `backend` para o Railway (ou o repo completo e aponte o root para `backend`).
2.  Configure as **Variables (Environment Variables)** no Railway:
    *   `PORT=3001`
    *   `DB_HOST=[Teu Host]`
    *   `DB_USER=[Teu User]`
    *   `DB_PASSWORD=[Tua Senha]`
    *   `DB_NAME=[Teu Database]`
    *   `JWT_SECRET=[Uma chave aleatória longa]`
    *   `ALLOWED_ORIGINS=https://teu-app.vercel.app` (Coloque aqui a URL final do Vercel depois)

## Passo 3: Deploy do Frontend (Vercel)
1.  Conecte o seu repositório GitHub ao Vercel.
2.  Configure o **Root Directory** como o diretório raiz (onde está o `package.json` principal).
3.  Configure as **Environment Variables** no Vercel Dashboard:
    *   `VITE_API_URL=https://teu-backend.railway.app/api`
    *   `VITE_SOCKET_URL=https://teu-backend.railway.app`
4.  Clique em Deploy.

---

## Observação sobre o Vercel
O arquivo `vercel.json` na raiz já foi configurado para tratar o roteamento do React (SPA), garantindo que as páginas não deem erro de "404 Not Found" ao serem atualizadas (F5).

## URLs Importantes
*   **Seu App**: `https://seu-projeto.vercel.app`
*   **Sua API**: `https://seu-backend.railway.app`
