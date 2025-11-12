# Sistema de Multitenancy

Este documento explica como o isolamento de dados entre contas funciona neste SaaS.

## Visão Geral

O sistema implementa **isolamento completo de dados** usando Row Level Security (RLS) do Supabase, garantindo que cada usuário tenha acesso apenas aos seus próprios dados.

## Arquitetura de Segurança

### 1. Relacionamentos de Tabelas

\`\`\`
users (Supabase Auth)
  └─→ instances (user_id)
       └─→ conversations (instance_id)
            └─→ messages (conversation_id)
       └─→ ai_agents (instance_id)
\`\`\`

### 2. Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas que:

- **SELECT**: Usuários só podem ver registros das suas instâncias
- **INSERT**: Usuários só podem criar registros para suas instâncias
- **UPDATE**: Usuários só podem atualizar registros das suas instâncias
- **DELETE**: Usuários só podem deletar registros das suas instâncias

### 3. Políticas Implementadas

#### Instances
\`\`\`sql
-- Usuários só veem suas próprias instâncias
CREATE POLICY "Users can view own instances"
  ON instances FOR SELECT
  USING (auth.uid() = user_id);
\`\`\`

#### Conversations
\`\`\`sql
-- Usuários só veem conversas das suas instâncias
CREATE POLICY "Users can view conversations from own instances"
  ON conversations FOR SELECT
  USING (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );
\`\`\`

#### Messages
\`\`\`sql
-- Usuários só veem mensagens de conversas das suas instâncias
CREATE POLICY "Users can view messages from own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );
\`\`\`

## Como Funciona na Prática

### Criação de Instância
1. Usuário cria uma instância via `/api/instances POST`
2. API verifica autenticação (`auth.getUser()`)
3. Instância é criada com `user_id = user.id`
4. RLS garante que `user_id` pertence ao usuário autenticado

### Listagem de Conversas
1. Usuário acessa `/dashboard/conversations`
2. API busca conversas via `/api/conversations GET`
3. RLS automaticamente filtra apenas conversas das instâncias do usuário
4. Nenhuma conversa de outro usuário é retornada

### Envio de Mensagens
1. Usuário envia mensagem para uma conversa
2. API verifica se a conversa pertence a uma instância do usuário (via RLS)
3. Se sim, mensagem é criada
4. Se não, operação é negada pelo RLS

## Vantagens do RLS

✅ **Segurança em camadas**: Proteção no nível do banco de dados
✅ **Sem vazamento de dados**: Impossível acessar dados de outros usuários
✅ **Simplicidade**: Não precisa adicionar `.eq('user_id')` em toda query
✅ **Performance**: Índices otimizados para queries com RLS
✅ **Auditável**: Políticas claras e testáveis

## Verificação de Segurança

### Testar Isolamento
\`\`\`sql
-- Como usuário A, tentar acessar instância do usuário B
SELECT * FROM instances WHERE id = 'instance_id_do_usuario_b';
-- Resultado: 0 linhas (bloqueado pelo RLS)
\`\`\`

### Verificar RLS Habilitado
\`\`\`sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('instances', 'conversations', 'messages')
ORDER BY tablename;
\`\`\`

## Webhooks e Service Role

Para webhooks externos (n8n), use o **Service Role Key** que bypassa RLS:

\`\`\`typescript
// Para webhooks que recebem mensagens
const supabase = await createAdminClient() // usa SUPABASE_SERVICE_ROLE_KEY
\`\`\`

⚠️ **Atenção**: Nunca exponha o Service Role Key no frontend!

## Manutenção

### Adicionar Nova Tabela

Ao criar uma nova tabela que deve ter isolamento:

1. Adicione coluna `user_id` ou relacionamento via `instance_id`
2. Habilite RLS: `ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;`
3. Crie políticas para SELECT, INSERT, UPDATE, DELETE
4. Adicione índices: `CREATE INDEX idx_tabela_user_id ON tabela(user_id);`

### Scripts de Migração

Execute o script `043_enable_rls_and_multitenancy.sql` para:
- Habilitar RLS em todas as tabelas
- Criar todas as políticas de segurança
- Adicionar índices de performance

## Troubleshooting

### Erro: "new row violates row-level security policy"
- Certifique-se que o usuário está autenticado
- Verifique se `user_id` está sendo definido corretamente
- Confirme que a política INSERT permite a operação

### Dados não aparecem após criar
- Verifique se RLS está habilitado: pode estar bloqueando
- Confirme que as políticas SELECT estão corretas
- Teste com Service Role Key para verificar se dados existem

## Documentação Relacionada

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
