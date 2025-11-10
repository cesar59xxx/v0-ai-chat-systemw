# Configuração de Variáveis de Ambiente na Vercel

## Problema: "Sistema não configurado"

Se você está vendo o erro "Sistema não configurado. Entre em contato com o administrador" ao tentar fazer login ou criar conta, significa que as variáveis de ambiente do Supabase não foram configuradas na Vercel.

## Solução: Adicionar Variáveis de Ambiente

### 1. Acesse o Painel da Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Selecione seu projeto
3. Clique em **Settings** (Configurações)
4. No menu lateral, clique em **Environment Variables** (Variáveis de Ambiente)

### 2. Adicione as Variáveis do Supabase

Você precisa adicionar as seguintes variáveis:

#### Variáveis Públicas (NEXT_PUBLIC_*)
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
\`\`\`

#### Variáveis do Servidor (apenas backend)
\`\`\`
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
\`\`\`

### 3. Onde Encontrar os Valores

1. Acesse seu projeto no [Supabase](https://supabase.com/dashboard)
2. Vá em **Project Settings** > **API**
3. Você encontrará:
   - **URL**: O valor para `SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: O valor para `SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: O valor para `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure para Todos os Ambientes

Na Vercel, ao adicionar cada variável, selecione todos os ambientes:
- ✅ Production
- ✅ Preview
- ✅ Development

### 5. Redeploy

Após adicionar as variáveis:
1. Vá em **Deployments** (na Vercel)
2. Clique nos três pontos do último deploy
3. Selecione **Redeploy**
4. Aguarde o deploy completar

### 6. Teste

Após o redeploy, tente fazer login ou criar uma conta novamente. O erro deve ter sido resolvido.

## Variáveis Opcionais

Se você estiver usando desenvolvimento local com redirecionamento:
\`\`\`
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
\`\`\`

## Troubleshooting

**Erro persiste após configurar?**
- Verifique se você fez o redeploy após adicionar as variáveis
- Confirme que os valores estão corretos (sem espaços extras)
- Verifique se selecionou todos os ambientes (Production, Preview, Development)

**Como verificar se as variáveis estão configuradas?**
- No terminal do seu projeto local, rode: `vercel env pull`
- Isso baixará as variáveis de ambiente e você pode verificar se estão corretas

**Precisa de ajuda?**
- Verifique a documentação do Supabase: https://supabase.com/docs
- Verifique a documentação da Vercel: https://vercel.com/docs/environment-variables
