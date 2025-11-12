# 🔐 Guia de Configuração do RLS (Row Level Security)

Este guia explica como configurar o isolamento completo de dados entre usuários do SaaS.

## 📋 Pré-requisitos

- Acesso ao Supabase SQL Editor
- Pelo menos um usuário criado no sistema
- Dados existentes migrados (se houver)

## 🚀 Passo a Passo

### 1. Execute o Script SQL

Acesse o Supabase SQL Editor e execute o script `scripts/045_complete_rls_and_user_isolation.sql`.

Este script irá:
- ✅ Adicionar coluna `user_id` em todas as tabelas
- ✅ Migrar dados existentes para associar ao user_id correto
- ✅ Criar índices para performance
- ✅ Remover políticas antigas (permissivas)
- ✅ Habilitar RLS em todas as tabelas
- ✅ Criar políticas restritivas (somente owner)
- ✅ Tornar `user_id` obrigatório (NOT NULL)
- ✅ Habilitar Realtime com RLS
- ✅ Criar triggers para propagar user_id automaticamente

### 2. Verificar RLS

Após executar o script, verifique se o RLS foi habilitado corretamente:

\`\`\`sql
-- Verificar status do RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('instances', 'conversations', 'messages', 'ai_agents');
\`\`\`

Todas as tabelas devem retornar `rowsecurity = true`.

### 3. Testar Isolamento

#### Teste 1: Criar duas contas diferentes

1. Crie usuário A: `user-a@example.com`
2. Crie usuário B: `user-b@example.com`

#### Teste 2: Criar instâncias

1. Login como usuário A → Crie instância "Instância A"
2. Login como usuário B → Crie instância "Instância B"

#### Teste 3: Verificar isolamento

1. Login como usuário A → Deve ver APENAS "Instância A"
2. Login como usuário B → Deve ver APENAS "Instância B"

**❌ Se ambos os usuários virem todas as instâncias, o RLS não está funcionando!**

### 4. Testar Mensagens

1. Envie mensagem no chat da Instância A
2. Login como usuário B
3. Verifique que usuário B NÃO vê mensagens da Instância A

## 🔍 Troubleshooting

### Problema: Usuários ainda veem dados de outros usuários

**Causa:** RLS pode não estar habilitado ou políticas estão incorretas.

**Solução:**
\`\`\`sql
-- Forçar RLS (ignorar bypass de superuser)
ALTER TABLE instances FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_agents FORCE ROW LEVEL SECURITY;
\`\`\`

### Problema: Erro "new row violates row-level security policy"

**Causa:** Tentando inserir dados sem user_id ou com user_id diferente do usuário autenticado.

**Solução:** Verificar se todas as INSERTs incluem `user_id: user.id`.

### Problema: Dados antigos sem user_id

**Causa:** Dados criados antes do script de migração.

**Solução:**
\`\`\`sql
-- Verificar registros sem user_id
SELECT 'instances' as table_name, COUNT(*) as count_null 
FROM instances WHERE user_id IS NULL
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations WHERE user_id IS NULL
UNION ALL
SELECT 'messages', COUNT(*) FROM messages WHERE user_id IS NULL;

-- Se houver registros sem user_id, execute novamente a parte de migração do script
\`\`\`

## 🧪 Teste Automatizado

Para testar se o RLS está funcionando:

\`\`\`sql
-- Criar dois usuários de teste
INSERT INTO auth.users (id, email) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'test-user-1@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'test-user-2@example.com');

-- Criar instância para usuário 1
INSERT INTO instances (user_id, name, phone_number) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Instance 1', '1111111111');

-- Criar instância para usuário 2
INSERT INTO instances (user_id, name, phone_number) VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Test Instance 2', '2222222222');

-- Simular query como usuário 1
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SELECT * FROM instances; -- Deve retornar APENAS 'Test Instance 1'

-- Simular query como usuário 2
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
SELECT * FROM instances; -- Deve retornar APENAS 'Test Instance 2'
\`\`\`

## ✅ Checklist Final

Antes de fazer deploy para produção:

- [ ] RLS habilitado em todas as tabelas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Políticas restritivas criadas (somente owner pode acessar seus dados)
- [ ] Coluna `user_id` existe em todas as tabelas
- [ ] Dados existentes migrados com `user_id` correto
- [ ] Índices criados para performance
- [ ] Triggers automáticos configurados
- [ ] Testes de isolamento passando
- [ ] Código da aplicação atualizado com filtros `user_id`
- [ ] Deploy realizado na Vercel

## 📚 Documentação Adicional

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
