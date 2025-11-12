-- =========================================
-- SCRIPT 043: HABILITAR RLS E MULTITENANCY
-- =========================================
-- Este script implementa isolamento completo de dados entre usuários
-- garantindo que cada conta só acesse suas próprias instâncias e mensagens

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_messages ENABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas antigas que permitiam acesso total
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON instances;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON conversations;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON ai_agents;
DROP POLICY IF EXISTS "Allow insert for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow select for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow delete for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow update for anon and authenticated users" ON messages;

-- 3. POLICIES PARA INSTANCES
-- Usuários só podem ver, criar, atualizar e deletar suas próprias instâncias
CREATE POLICY "Users can view own instances"
  ON instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instances"
  ON instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instances"
  ON instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instances"
  ON instances FOR DELETE
  USING (auth.uid() = user_id);

-- 4. POLICIES PARA CONVERSATIONS
-- Usuários só podem ver conversas das suas instâncias
CREATE POLICY "Users can view conversations from own instances"
  ON conversations FOR SELECT
  USING (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversations for own instances"
  ON conversations FOR INSERT
  WITH CHECK (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations from own instances"
  ON conversations FOR UPDATE
  USING (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete conversations from own instances"
  ON conversations FOR DELETE
  USING (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

-- 5. POLICIES PARA MESSAGES
-- Usuários só podem ver mensagens de conversas das suas instâncias
CREATE POLICY "Users can view messages from own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from own conversations"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from own conversations"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

-- 6. POLICIES PARA AI_AGENTS
-- Usuários só podem gerenciar AI agents das suas instâncias
CREATE POLICY "Users can view agents from own instances"
  ON ai_agents FOR SELECT
  USING (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agents for own instances"
  ON ai_agents FOR INSERT
  WITH CHECK (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agents from own instances"
  ON ai_agents FOR UPDATE
  USING (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agents from own instances"
  ON ai_agents FOR DELETE
  USING (
    instance_id IN (
      SELECT id FROM instances WHERE user_id = auth.uid()
    )
  );

-- 7. POLICIES PARA SENT_MESSAGES (legado)
CREATE POLICY "Users can view own sent messages"
  ON sent_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sent messages"
  ON sent_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

-- 8. POLICIES PARA RECEIVED_MESSAGES (legado)
CREATE POLICY "Users can view own received messages"
  ON received_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own received messages"
  ON received_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      INNER JOIN instances i ON c.instance_id = i.id
      WHERE i.user_id = auth.uid()
    )
  );

-- 9. Permitir que o service role bypass RLS (necessário para webhooks)
ALTER TABLE instances FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_agents FORCE ROW LEVEL SECURITY;
ALTER TABLE sent_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE received_messages FORCE ROW LEVEL SECURITY;

-- 10. Criar índices para melhorar performance das queries com RLS
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_instance_id ON conversations(instance_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_instance_id ON ai_agents(instance_id);

-- Verificação
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('instances', 'conversations', 'messages', 'ai_agents')
ORDER BY tablename;
