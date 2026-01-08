---
description: Plano de Atualização e Melhoria do Sistema SROC (CONCLUÍDO ✅)
---

# 📋 PLANO DE IMPLEMENTAÇÃO - SROC v2.0

## 📌 Visão Geral
Atualização completa do sistema SROC com foco em:
1. Inteligência no cadastro de clientes (autopreenchimento por NUIT)
2. Dashboards melhorados para Admin e Agentes
3. Backup automatizado e gestão de retenção de dados
4. UI/UX moderna e responsiva

---

## 🗂️ FASE 1: Inteligência no Cadastro de Clientes

### 1.1 Criar tabela de clientes (Backend)
- Adicionar tabela `clients` no banco de dados
- Campos: id, nuit (único), nome, entidade, agencia, contacto, whatsapp, created_at, updated_at
- Criar endpoint `/api/clients/search?nuit=XXXXX` para busca por NUIT

### 1.2 API de busca de cliente por NUIT
- GET `/api/clients/search/:nuit` - retorna dados do cliente se existir
- POST `/api/clients` - cria novo cliente

### 1.3 Atualizar CallForm.tsx
- Adicionar debounce na busca por NUIT (300ms)
- Quando NUIT for digitado, buscar cliente automaticamente
- Se encontrado, preencher campos automaticamente com indicador visual
- Mostrar badge "Cliente Existente" ou "Novo Cliente"

---

## 🗂️ FASE 2: Dashboards Melhorados

### 2.1 Dashboard Administrativo (Admin)
- Estatísticas avançadas: chamadas por período, entidade, tipo, agente
- Gráficos interativos (barras, pizza, linhas de tendência)
- Filtros por data, agente, entidade, tipo de pedido
- KPIs principais: Total de chamadas, Taxa de resolução, Tempo médio
- Ranking de agentes com performance

### 2.2 Dashboard do Agente
- Visão focada nas próprias chamadas
- Metas diárias/semanais (se configurado)
- Lista de tarefas pendentes
- Acesso rápido às chamadas recentes
- Widget de status (Online, Em atendimento)

### 2.3 Componentes visuais modernos
- Cards com gradientes e sombras suaves
- Animações de entrada suaves
- Indicadores de progresso animados
- Cores consistentes com a identidade visual

---

## 🗂️ FASE 3: Backup e Retenção de Dados

### 3.1 Backend - Endpoints de Backup
- GET `/api/backup/export` - Exporta todos os dados em JSON/SQL
- GET `/api/backup/status` - Status do último backup
- POST `/api/backup/settings` - Configurar backup automático

### 3.2 Gestão de Retenção
- Configuração de período de retenção (meses)
- Arquivamento de dados antigos (separar de dados ativos)
- Rotina de limpeza automática (opcional)
- Log de operações de backup/limpeza

### 3.3 Interface de Administração
- Aba de Backup nas Configurações
- Botão "Exportar Backup Agora"
- Histórico de backups
- Configurações de retenção

---

## 🗂️ FASE 4: UI/UX Premium

### 4.1 Design System Aprimorado
- Paleta de cores refinada (tons de indigo, slate, emerald)
- Tipografia consistente (Plus Jakarta Sans)
- Espaçamentos e bordas arredondadas
- Sombras sutis com profundidade

### 4.2 Componentes atualizados
- Sidebar com animações e ícones modernos
- Cards com hover effects
- Tabelas com ordenação e destaque
- Modais com backdrop blur
- Toasts animados

### 4.3 Performance
- Lazy loading de componentes
- Memoização onde necessário
- Otimização de re-renders

---

## 🛠️ ORDEM DE EXECUÇÃO

// turbo-all
1. Criar schema da tabela clients no MySQL
2. Criar endpoints de clientes no backend
3. Implementar busca por NUIT no CallForm
4. Redesenhar Dashboard administrativo
5. Redesenhar Dashboard de agentes
6. Implementar sistema de backup
7. Criar interface de gestão de retenção
8. Polimento final de UI/UX
9. Testes de integração
10. Documentação das mudanças

---

## 📁 Arquivos a serem modificados/criados

### Backend
- `backend/database/schema.sql` - Tabela clients
- `backend/routes/clients.js` - CRUD de clientes
- `backend/routes/backup.js` - Endpoints de backup
- `backend/server.js` - Registrar novas rotas

### Frontend
- `components/CallForm.tsx` - Busca por NUIT
- `components/Dashboard.tsx` - Dashboard avançado
- `components/DashboardAdmin.tsx` - Nova: Dashboard admin
- `components/DashboardAgent.tsx` - Nova: Dashboard agente
- `components/BackupSettings.tsx` - Nova: Gestão de backup
- `services/api.ts` - Novos endpoints
- `types.ts` - Novos tipos
- `index.css` - Estilos adicionais

---

## ⚠️ PRESERVAÇÃO DOS DADOS
- Todas as alterações são aditivas (sem remover dados)
- Backup deve ser feito antes de migrar
- Migração da tabela calls para popular clients automaticamente
