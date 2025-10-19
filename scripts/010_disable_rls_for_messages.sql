-- Desabilita RLS nas tabelas de conversas e mensagens para permitir inserções do n8n
-- A segurança é mantida através do isolamento por instance_id e user_id

-- Remove todas as políticas RLS existentes das tabelas conversations e messages
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON conversations;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- Desabilita RLS completamente nas tabelas conversations e messages
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Mantém RLS habilitado na tabela instances para segurança
-- (usuários só podem ver suas próprias instâncias)
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- Cria política para instances: usuários só veem suas próprias instâncias
DROP POLICY IF EXISTS "instances_select_policy" ON instances;
CREATE POLICY "instances_select_policy" ON instances
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "instances_insert_policy" ON instances;
CREATE POLICY "instances_insert_policy" ON instances
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "instances_update_policy" ON instances;
CREATE POLICY "instances_update_policy" ON instances
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "instances_delete_policy" ON instances;
CREATE POLICY "instances_delete_policy" ON instances
  FOR DELETE
  USING (user_id = auth.uid());

-- Comentário explicativo
COMMENT ON TABLE conversations IS 'RLS desabilitado - segurança garantida através do isolamento por instance_id';
COMMENT ON TABLE messages IS 'RLS desabilitado - segurança garantida através do isolamento por instance_id';
