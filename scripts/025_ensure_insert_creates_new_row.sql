-- Remove todos os triggers que podem estar interferindo com INSERT
DROP TRIGGER IF EXISTS trigger_auto_populate_message_fields ON messages;
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
DROP TRIGGER IF EXISTS trigger_convert_whatsapp_instance_id ON messages;
DROP TRIGGER IF EXISTS trigger_set_instance_fields ON messages;

-- Remove todas as funções relacionadas
DROP FUNCTION IF EXISTS auto_populate_message_fields() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_on_message() CASCADE;
DROP FUNCTION IF EXISTS convert_whatsapp_instance_id() CASCADE;
DROP FUNCTION IF EXISTS set_instance_fields() CASCADE;

-- Garante que não há constraint UNIQUE que possa causar conflito
-- (exceto a chave primária 'id')
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_id_key;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_unique_message;

-- Adiciona índices para melhor performance (sem UNIQUE)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_instance_name ON messages(instance_name);

-- Cria um trigger simples apenas para atualizar a conversa quando uma mensagem é inserida
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica o trigger AFTER INSERT (não BEFORE, para não interferir)
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Verifica se há mensagens duplicadas e mostra
SELECT 
  conversation_id, 
  content, 
  direction,
  COUNT(*) as count
FROM messages
GROUP BY conversation_id, content, direction
HAVING COUNT(*) > 1;
