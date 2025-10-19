-- Script para permitir que o n8n insira dados diretamente no Supabase
-- Este script ajusta as políticas RLS para permitir inserções diretas
-- mantendo a segurança para leitura e modificação

-- ============================================
-- TABELA: conversations
-- ============================================

-- Remove políticas antigas
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Service role can insert conversations" ON conversations;

-- Política de INSERT: Permite inserções diretas (para n8n)
-- Qualquer requisição autenticada pode inserir
CREATE POLICY "Allow direct inserts to conversations"
ON conversations
FOR INSERT
WITH CHECK (true);

-- Política de SELECT: Usuários só veem conversas de suas instâncias
CREATE POLICY "Users can view their own conversations"
ON conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM instances
    WHERE instances.id = conversations.instance_id
    AND instances.user_id = auth.uid()
  )
);

-- Política de UPDATE: Usuários só atualizam conversas de suas instâncias
CREATE POLICY "Users can update their own conversations"
ON conversations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM instances
    WHERE instances.id = conversations.instance_id
    AND instances.user_id = auth.uid()
  )
);

-- Política de DELETE: Usuários só deletam conversas de suas instâncias
CREATE POLICY "Users can delete their own conversations"
ON conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM instances
    WHERE instances.id = conversations.instance_id
    AND instances.user_id = auth.uid()
  )
);

-- ============================================
-- TABELA: messages
-- ============================================

-- Remove políticas antigas
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Service role can insert messages" ON messages;

-- Política de INSERT: Permite inserções diretas (para n8n)
-- Qualquer requisição autenticada pode inserir
CREATE POLICY "Allow direct inserts to messages"
ON messages
FOR INSERT
WITH CHECK (true);

-- Política de SELECT: Usuários só veem mensagens de suas instâncias
CREATE POLICY "Users can view their own messages"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM instances
    WHERE instances.id = messages.instance_id
    AND instances.user_id = auth.uid()
  )
);

-- Política de UPDATE: Usuários só atualizam mensagens de suas instâncias
CREATE POLICY "Users can update their own messages"
ON messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM instances
    WHERE instances.id = messages.instance_id
    AND instances.user_id = auth.uid()
  )
);

-- Política de DELETE: Usuários só deletam mensagens de suas instâncias
CREATE POLICY "Users can delete their own messages"
ON messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM instances
    WHERE instances.id = messages.instance_id
    AND instances.user_id = auth.uid()
  )
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verifica se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;
