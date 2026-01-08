## 🎯 IMPLEMENTAÇÃO COMPLETA: LOGO NO RELATÓRIO EXCEL

### ✅ O que foi implementado:

#### 1. **Backend - ExcelJS com Logo Embedding**
- ✅ Instalado `exceljs` no backend
- ✅ Completamente reescrito `backend/routes/export.js` para usar ExcelJS
- ✅ Formatação profissional:
  - Logo incorporado no topo (busca do banco de dados)
  - Título formatado: "RELATÓRIO OPERACIONAL SROC - [DATA]"
  - Cabeçalhos coloridos e estilizados
  - Alternância de cores (zebrado) nas linhas
  - Bordas e alinhamentos profissionais
  - Células mescladas para cabeçalhos

#### 2. **API de Configuração**
- ✅ Criado `backend/routes/config.js` com endpoints:
  - `GET /api/config` - Obter configuração atual
  - `POST /api/config/logo` - Salvar logo em Base64

#### 3. **Base de Dados**
- ✅ Script SQL criado: `backend/database/add_report_logo.sql`
- ✅ Server.js atualizado:
  - Import de `configRoutes`
  - Registro da rota `/api/config`
  - Limite aumentado para 50MB (imagens base64)

#### 4. **Frontend**
- ✅ Filtro por agente adicionado em `CallList.tsx`
- ✅ Prop `users` passada do `App.tsx` para `CallList`
- ✅ Dropdown "AGENTES" funcional

### 📋 TAREFAS PENDENTES:

#### 1. **Executar migração do banco de dados:**
```sql
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_logo LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Pode executar via MySQL Workbench ou phpMyAdmin (XAMPP).

Ou via terminal:
```bash
mysql -u root -p sroc_db < backend/database/add_report_logo.sql
```

#### 2. **Adicionar UI de Upload de Logo nas Configurações:**

No componente `Settings.tsx`, adicione esta seção:

```tsx
<div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
  <h3 className="text-lg font-black text-slate-800 mb-4">Logo do Relatório</h3>
  <p className="text-sm text-slate-600 mb-4">
    Faça upload de um logotipo para aparecer no relatório Excel exportado.
  </p>
  
  <input
    type="file"
    accept="image/*"
    className="block w-full text-sm text-slate-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-lg file:border-0
      file:text-sm file:font-semibold
      file:bg-indigo-50 file:text-indigo-700
      hover:file:bg-indigo-100"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        try {
          const response = await fetch('http://localhost:3001/api/config/logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoBase64: base64 })
          });
          
          if (response.ok) {
            alert('Logo atualizado com sucesso!');
          }
        } catch (error) {
          alert('Erro ao fazer upload do logo');
        }
      };
      reader.readAsDataURL(file);
    }}
  />
</div>
```

#### 3. **Reiniciar o Backend:**
O servidor precisa ser reiniciado para carregar as novas rotas.

### 🚀 TESTE FINAL:

1. Execute a migração SQL
2. Reinicie o backend (encerre e rode `node server.js` novamente)
3. Force refresh no frontend (Ctrl + Shift + R)
4. Vá para Configurações e faça upload de um logo
5. Exporte um relatório Excel
6. Abra o ficheiro - deverá ver:
   - Seu logo no topo
   - Formatação profissional
   - Nome correto: `SROC_Export_2025-12-25.xlsx`

### 📸 FORMATO FINAL DO EXCEL:
```
┌─────────────────────────────────────────┐
│          [LOGO AQUI]                    │
├─────────────────────────────────────────┤
│  RELATÓRIO OPERACIONAL SROC - DATA      │
├─────────────────────────────────────────┤
│ Instituição: SROC  |  Extraído em: XX   │
├──┬─────┬──────┬─────┬─────┬─────┬──────┤
│NUIT│CLIENTE│ENTIDADE│AGÊNCIA│...│OBS   │
├──┼─────┼──────┼─────┼─────┼─────┼──────┤
│123│João │ABC   │Sede │...  │...   │...   │
└──┴─────┴──────┴─────┴─────┴─────┴──────┘
```

Tudo pronto! Quer que eu adicione a interface de upload automaticamente no Settings.tsx?
