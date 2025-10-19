-- Ajustar políticas RLS para permitir inserções via service role (webhook)

-- Remover políticas existentes que podem estar bloqueando
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;

-- Criar políticas mais permissivas para conversations
CREATE POLICY "Users can manage their own conversations"
ON conversations
FOR ALL
USING (
  instance_id IN (
    SELECT id FROM instances WHERE user_id = auth.uid()
  )
);

-- Permitir inserções via service role (webhook)
CREATE POLICY "Service role can insert conversations"
ON conversations
FOR INSERT
WITH CHECK (true);

-- Criar políticas mais permissivas para messages
CREATE POLICY "Users can manage their own messages"
ON messages
FOR ALL
USING (
  instance_id IN (
    SELECT id FROM instances WHERE user_id = auth.uid()
  )
);

-- Permitir inserções via service role (webhook)
CREATE POLICY "Service role can insert messages"
ON messages
FOR INSERT
WITH CHECK (true);

-- Garantir que as tabelas têm RLS habilitado
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_instance_contact 
ON conversations(instance_id, contact_number);

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_instance 
ON messages(instance_id);
