# Guia de Migração para Ambiente Interno (On-Premise) - SROC v2.0

Este documento detalha todo o processo necessário para migrar o sistema SROC (Sistema de Registo Operacional de Chamadas) de um ambiente em nuvem (Vercel/Railway) para um servidor interno da empresa (On-Premise), seja Linux ou Windows.

---

## 1. Requisitos de Infraestrutura

Para garantir um bom desempenho, oferecemos dois níveis de requisitos. O nível "Económico" é suficiente para iniciar, enquanto o "Recomendado" oferece folga para crescimento.

### Hardware Recomendado (Servidor)

**Opção A: Económico (Mínimo Viável - até 30 utilizadores)**
| Componente | Linux (Leve - Recomendado) | Windows Server |
| :--- | :--- | :--- |
| **CPU** | 1 vCPU | 2 vCPUs |
| **RAM** | 2 GB | 4 GB |
| **Armazenamento** | 20 GB SSD | 40 GB SSD |

**Opção B: Confortável (Até 100+ utilizadores)**
| Componente | Linux | Windows Server |
| :--- | :--- | :--- |
| **CPU** | 2 vCPUs | 4 vCPUs |
| **RAM** | 4 GB | 8 GB |
| **Armazenamento** | 40 GB SSD | 60 GB SSD |

> [!TIP]
> **Por que Linux é mais barato?** O Windows Server consome ~2GB de RAM só para rodar o sistema. O Linux consome apenas ~200MB, deixando quase todo o hardware livre para o SROC. Se quiser economizar hardware, use Linux.

### Software Necessário
1.  **Sistema Operacional:**
    *   Linux: Ubuntu 20.04/22.04 LTS (Recomendado) ou Debian 11/12.
    *   Windows: Windows Server 2019 ou 2022.
2.  **Runtime:** Node.js v18.x ou v20.x (LTS).
3.  **Banco de Dados:** MySQL Server 8.0+.
4.  **Gerenciador de Processos:** PM2 (Instalado via npm).
5.  **Servidor Web (Reverso):** Nginx (Linux) ou IIS (Windows - opcional, pode rodar direto na porta).
6.  **Git** (para baixar o código/atualizações).

---

## 2. Preparação do Ambiente

### 2.1 Instalação das Dependências

#### Linux (Ubuntu/Debian)
```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar MySQL Server
sudo apt install -y mysql-server
sudo mysql_secure_installation # Configure senha root e segurança

# 4. Instalar PM2 (Global)
sudo npm install -g pm2
```

#### Windows Server
1.  **Node.js:** Baixe e instale o instalador .msi LTS em [nodejs.org](https://nodejs.org/).
2.  **MySQL:** Baixe o MySQL Installer em [dev.mysql.com](https://dev.mysql.com/downloads/installer/) e instale o "Server only".
3.  **PM2:** Abra o PowerShell como Administrador e rode: `npm install -g pm2`.
4.  **Git:** Instale o Git for Windows.

---

## 3. Migração de Dados (Banco de Dados)

Você precisará exportar os dados do Railway e importar no servidor local.

1.  **Exportar do Railway:**
    *   Utilize o DBeaver ou Workbench conectado ao Railway.
    *   Faça um Dump SQL (Export Database) incluindo Estrutura e Dados.
    *   Salve como `backup_producao.sql`.

2.  **Importar no Servidor Local:**
    *   No servidor novo, logue no MySQL:
        ```bash
        mysql -u root -p
        ```
    *   Crie o banco e usuário:
        ```sql
        CREATE DATABASE sroc_db;
        CREATE USER 'sroc_user'@'localhost' IDENTIFIED BY 'SenhaForteEmpresa123!';
        GRANT ALL PRIVILEGES ON sroc_db.* TO 'sroc_user'@'localhost';
        FLUSH PRIVILEGES;
        EXIT;
        ```
    *   Importe o arquivo SQL:
        ```bash
        mysql -u root -p sroc_db < backup_producao.sql
        ```

---

## 4. Instalação da Aplicação

### 4.1 Clonar/Copiar o Projeto
Copie os arquivos do projeto para uma pasta no servidor (ex: `/opt/sroc` no Linux ou `C:\sroc` no Windows).

### 4.2 Configurar o Backend
1.  Entre na pasta `backend`:
    ```bash
    cd backend
    ```
2.  Instale as dependências:
    ```bash
    npm install --production
    ```
3.  Crie o arquivo `.env` com as configurações locais:
    ```env
    PORT=3001
    DB_HOST=localhost
    DB_USER=sroc_user
    DB_PASSWORD=SenhaForteEmpresa123!
    DB_NAME=sroc_db
    JWT_SECRET=ChaveSuperSecretaInternaDaEmpresa
    ALLOWED_ORIGINS=http://seu-servidor-ip,http://localhost
    NODE_ENV=production
    ```

### 4.3 Configurar o Frontend (Build Estático)
O Frontend deve ser "buildado" para arquivos estáticos (HTML/CSS/JS) e servido pelo Backend ou Nginx. **Recomendamos servir pelo Backend para simplificar.**

1.  Volte para a raiz do projeto:
    ```bash
    cd ..
    ```
2.  Ajuste o `.env` do Frontend (se houver, ou crie `.env.production`) para apontar para o IP do servidor novo:
    ```env
    VITE_API_URL=http://SEU_IP_SERVIDOR:3001/api
    VITE_SOCKET_URL=http://SEU_IP_SERVIDOR:3001
    ```
3.  Instale deps do frontend e gere o build:
    ```bash
    npm install
    npm run build
    ```
    *Isso vai gerar a pasta `dist`.*

4.  **Importante:** Mova a pasta `dist` (que acabou de ser criada na raiz) para dentro da pasta `backend`, ou certifique-se de que o `backend/server.js` está configurado para servir a pasta `../dist` ou `./dist`.
    *   *Verificação:* Se o arquivo `server.js` tiver algo como `app.use(express.static(path.join(__dirname, '../dist')))` está ok. Caso contrário, ajuste o caminho.

---

## 5. Execução em Produção

### Usando PM2 (Gerenciador de Processos)

O PM2 mantém o sistema rodando, reinicia em caso de falha e inicia junto com o sistema.

1.  Iniciar a aplicação (dentro da pasta `backend`):
    ```bash
    pm2 start server.js --name "sroc-v2"
    ```

2.  Configurar inicialização automática (Startup):
    *   **Linux:**
        ```bash
        pm2 startup
        # Copie e rode o comando que ele exibir
        pm2 save
        ```
    *   **Windows:**
        Precisa instalar um pacote extra:
        ```powershell
        npm install pm2-windows-startup -g
        pm2-startup install
        pm2 save
        ```

3.  Verificar logs e status:
    ```bash
    pm2 status
    pm2 logs
    ```

---

## 6. Configuração de Rede (Firewall)

Certifique-se de liberar as portas no Firewall da empresa.

*   **Porta da Aplicação:** 3001 (TCP).
*   Se usar Nginx como Proxy Reverso (Recomendado para Linux/Prod), abra a porta 80 e direcione para a 3001.

### (Opcional) Proxy Reverso Nginx (Linux)
Crie um arquivo `/etc/nginx/sites-available/sroc`:
```nginx
server {
    listen 80;
    server_name sroc.empresa.local; # Ou IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Ative com: `ln -s /etc/nginx/sites-available/sroc /etc/nginx/sites-enabled/` e `nginx -t && systemctl restart nginx`.

---

## 7. Checklist de Validação

- [ ] Banco de dados connectado ✅
- [ ] Aplicação respondendo na porta 3001 ✅
- [ ] Frontend carregando (tela de login) ✅
- [ ] Login funcionando ✅
- [ ] WebSockets (Chat) funcionando (teste enviar mensagem) ✅
- [ ] Logs do PM2 sem erros (`pm2 logs`) ✅
