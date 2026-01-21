# 🌓 Guia de Implementação do Dark Mode - SROC v2

## ✅ Status da Implementação

### Arquivos Base (Concluídos)
- [x] `contexts/ThemeContext.tsx` - Context API para gerenciar tema
- [x] `components/ThemeToggle.tsx` - Botão de alternância de tema
- [x] `index.css` - Variáveis CSS e estilos base  de Dark Mode
- [x] `index.tsx` - ThemeProvider aplicado
- [x] `App.tsx` - Classes dark adicionadas + ThemeToggle no header
- [x] `tailwind.config.js` - Configuração do Tailwind com darkMode: 'class'

### Componentes Principais (Pendentes)
- [ ] `components/Dashboard.tsx`
- [ ] `components/CallForm.tsx`
- [ ] `components/CallList.tsx`
- [ ] `components/Chat.tsx`
- [ ] `components/Settings.tsx`
- [ ] `components/UserManagement.tsx`
- [ ] `components/ProfileModal.tsx`
- [ ] `components/PasswordChangeModal.tsx`
- [ ] `components/ForcePasswordChangeModal.tsx`
- [ ] `components/ConfirmationModal.tsx`
- [ ] `components/BackupSettings.tsx`
- [ ] `components/ObservationTemplatesManager.tsx`
- [ ] `components/Sidebar.tsx` - Já tem tema escuro nativo

### Componente Login
- [ ] `components/Login.tsx` - Já tem tema escuro nativo, mas precisa adaptar para ser alternável

## 📋 Padrões de Classes Dark Mode

### Backgrounds
```tsx
// Primário
className="bg-white dark:bg-slate-800"

// Secundário
className="bg-slate-50 dark:bg-slate-900"

// Terciário
className="bg-slate-100 dark:bg-slate-700"

// Hover
className="hover:bg-slate-50 dark:hover:bg-slate-700"
```

### Textos
```tsx
// Texto Principal
className="text-slate-800 dark:text-slate-100"
className="text-slate-900 dark:text-slate-50"

// Texto Secundário
className="text-slate-600 dark:text-slate-300"

// Texto Terciário (mais claro)
className="text-slate-400 dark:text-slate-400"
className="text-slate-500 dark:text-slate-500"
```

### Bordas
```tsx
// Borda Normal
className="border-slate-200 dark:border-slate-700"

// Borda Clara
className="border-slate-100 dark:border-slate-800"

// Borda com Foco
className="focus:border-indigo-500 dark:focus:border-indigo-400"
```

### Shadows
```tsx
// Sombra Suave
className="shadow-sm dark:shadow-slate-900/50"

// Sombra Média
className="shadow-md dark:shadow-slate-900/70"

// Sombra Forte
className="shadow-lg dark:shadow-2xl"
```

### Inputs e Forms
```tsx
// Input Base
className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"

// Input Focus
className="focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
```

### Botões
```tsx
// Botão Secundário
className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"

// Botão Primário (mantém gradiente)
className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
```

### Cards
```tsx
// Card Base
className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/30"
```

## 🔄 Próximos Passos

1. **Dashboard.tsx** - Aplicar classes dark em:
   - Hero section
   - Quick stats cards
   - Stage distribution
   - Charts e rankings
   - Activity feed

2. **CallForm.tsx** - Aplicar dark em:
   - Formulário principal
   - Inputs e selects
   - Botões de ação

3. **CallList.tsx** - Aplicar dark em:
   - Tabela de chamadas
   - Filtros
   - Modal de edição

4. **Chat.tsx** - Aplicar dark em:
   - Lista de salas
   - Mensagens
   - Input de mensagem
   - Cabeçalhos

5. **Settings.tsx** - Aplicar dark em:
   - Abas de configuração
   - Formulários
   - Tabelas de utilizadores

## 🎨 Preservação Visual

O Dark Mode deve manter:
- ✅ Todos os gradientes coloridos (indigo, purple, emerald, etc.)
- ✅ Badges e indicadores (mantêm cores vibrantes)
- ✅ Ícones e ilustrações
- ✅ Animações e transições
- ✅ Efeitos de hover e focus
- ✅ Sombras coloridas (ex: shadow-indigo-500/25)

## 🧪 Testes Necessários

Após implementação completa, testar:
- [ ] Alternância de tema funciona em todas as páginas
- [ ] localStorage persiste a preferência
- [ ] Não há "flash" de tema errado ao carregar
- [ ] Contraste adequado (WCAG AA)
- [ ] Todos os textos são legíveis
- [ ] Inputs e formulários funcionais
- [ ] Modais e overlays corretos
- [ ] Transições suaves entre temas
