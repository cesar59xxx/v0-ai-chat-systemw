# Deploy na Vercel

Este guia explica como fazer deploy do projeto na Vercel.

## Pré-requisitos

1. Conta na Vercel (https://vercel.com)
2. Integração com Supabase configurada
3. Variáveis de ambiente configuradas

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel da Vercel:

### Supabase (Obrigatório)
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
\`\`\`

### Configurações Adicionais
\`\`\`
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://seu-dominio.vercel.app/dashboard
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook (opcional)
\`\`\`

## Passos para Deploy

### 1. Via Interface da Vercel

1. Acesse https://vercel.com/new
2. Importe o repositório do GitHub
3. Configure as variáveis de ambiente na seção "Environment Variables"
4. Clique em "Deploy"

### 2. Via Vercel CLI

\`\`\`bash
# Instalar Vercel CLI
npm i -g vercel

# Login na Vercel
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
\`\`\`

## Configuração do Banco de Dados

Após o deploy, execute os scripts SQL na ordem:

1. `scripts/001_create_base_tables.sql` - Tabelas básicas
2. `scripts/040_restructure_messages_system.sql` - Sistema de mensagens
3. `scripts/041_unify_messages_table.sql` - Unificação de mensagens
4. `scripts/042_enable_realtime_on_messages.sql` - Ativar realtime
5. **`scripts/043_enable_rls_and_multitenancy.sql` - Isolamento multitenancy (IMPORTANTE)**

## Verificação Pós-Deploy

1. Acesse `https://seu-dominio.vercel.app`
2. Teste o login/cadastro
3. Verifique as conversas e mensagens
4. Confirme que o realtime está funcionando
5. **Teste o isolamento criando duas contas diferentes e verificando que dados não são compartilhados**

## Troubleshooting

### Erro: "Configuração do Supabase incompleta"
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que os valores começam com `NEXT_PUBLIC_` para variáveis client-side

### Erro de Build
- Verifique os logs de build na Vercel
- Confirme que todas as dependências estão no `package.json`
- Execute `pnpm install` localmente para testar

### Realtime não funciona
- Execute o script `042_enable_realtime_on_messages.sql`
- Verifique as políticas RLS no Supabase

### Erro: "Unauthorized" ou dados de outras contas aparecem
- Execute o script `043_enable_rls_and_multitenancy.sql` imediatamente
- Verifique que RLS está habilitado em todas as tabelas
- Consulte a documentação em `MULTITENANCY.md`

## Segurança

O sistema implementa isolamento completo de dados usando Row Level Security (RLS). Para mais detalhes, consulte:
- [MULTITENANCY.md](./MULTITENANCY.md) - Documentação completa sobre isolamento de dados
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório.
