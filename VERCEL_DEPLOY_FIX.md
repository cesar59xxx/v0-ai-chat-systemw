# 🚀 Como Corrigir Erro de Variáveis de Ambiente na Vercel

## ❌ Erro Atual
\`\`\`
Sistema não configurado. Entre em contato com o administrador.
\`\`\`

Este erro acontece quando as variáveis de ambiente do Supabase não estão configuradas na Vercel.

## ✅ Solução Passo a Passo

### 1️⃣ Acessar o Painel da Vercel

1. Vá para [vercel.com](https://vercel.com)
2. Selecione seu projeto
3. Clique em **Settings** (engrenagem no topo)

### 2️⃣ Adicionar Variáveis de Ambiente

1. No menu lateral, clique em **Environment Variables**
2. Adicione as seguintes variáveis:

\`\`\`bash
# Variável 1
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://becaqqskgbmfsgizfvvv.supabase.co
Environment: ✅ Production ✅ Preview ✅ Development

# Variável 2
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlY2FxcXNrZ2JtZnNnaXpmdnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjgwNTIsImV4cCI6MjA3NTYwNDA1Mn0.7iUQDi95BVyXWYbaed9gzcKkV_LVvRRQ5TX2gIr3ID0
Environment: ✅ Production ✅ Preview ✅ Development

# Variável 3 (Opcional para redirect após login)
Name: NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
Value: http://localhost:3000
Environment: ✅ Development
\`\`\`

**⚠️ IMPORTANTE:** Marque as três opções (Production, Preview, Development) para cada variável!

### 3️⃣ Fazer Redeploy

Após adicionar as variáveis, você DEVE fazer um novo deploy:

1. Vá para a aba **Deployments**
2. Encontre o último deploy
3. Clique nos três pontos (...) ao lado
4. Selecione **Redeploy**
5. Clique em **Redeploy** novamente para confirmar

### 4️⃣ Verificar se Funcionou

1. Aguarde o deploy completar (1-2 minutos)
2. Acesse seu site deployado
3. Abra o Console do navegador (F12 > Console)
4. Você deve ver:
   \`\`\`
   [v0] Supabase Config Check:
     - URL presente: true
     - URL valor: https://becaqqskgbmfsgizfvvv...
     - Key presente: true
     - Key valor: eyJhbGciOiJIUzI1NiIsInR...
   [v0] ✅ Configuração do Supabase válida
   \`\`\`

5. Tente fazer login ou criar uma conta

## 🔍 Troubleshooting

### Ainda vendo "Sistema não configurado"?

1. **Certifique-se que marcou Production/Preview/Development**
   - As variáveis precisam estar em todos os ambientes

2. **Verifique se fez o Redeploy**
   - Adicionar variáveis não atualiza deploys existentes
   - É necessário fazer um novo deploy

3. **Aguarde o cache limpar**
   - Em alguns casos, pode levar 1-2 minutos para propagar
   - Tente fazer hard refresh: Ctrl + Shift + R (ou Cmd + Shift + R no Mac)

4. **Verifique o Console do Navegador**
   - Abra F12 > Console
   - Procure por mensagens `[v0]`
   - Isso mostrará se as variáveis estão sendo carregadas

### Erro "Invalid JWT"?

- Verifique se copiou a `NEXT_PUBLIC_SUPABASE_ANON_KEY` corretamente
- Deve ser a chave **anon/public**, não a service_role

### Erro "Database connection failed"?

- Verifique se a URL do Supabase está correta
- Certifique-se que o projeto Supabase está ativo

## 📱 Contato

Se ainda tiver problemas, compartilhe:
1. Screenshot do Console do navegador (F12)
2. Screenshot das Environment Variables na Vercel
3. URL do deploy que está testando
