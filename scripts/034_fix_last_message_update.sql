-- Script para corrigir a atualização do last_message nas conversas
-- Este script cria triggers que atualizam automaticamente o last_message
-- quando uma mensagem é enviada ou recebida

-- Remove triggers antigos se existirem
DROP TRIGGER IF EXISTS update_conversation_last_message_on_sent ON sent_messages;
DROP TRIGGER IF EXISTS update_conversation_last_message_on_received ON received_messages;
DROP FUNCTION IF EXISTS update_conversation_last_message();

-- Cria função para atualizar last_message da conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza a conversa com a última mensagem
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger para mensagens enviadas
CREATE TRIGGER update_conversation_last_message_on_sent
AFTER INSERT ON sent_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Cria trigger para mensagens recebidas
CREATE TRIGGER update_conversation_last_message_on_received
AFTER INSERT ON received_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Atualiza last_message de todas as conversas existentes
-- baseado na última mensagem (enviada ou recebida)
UPDATE conversations c
SET 
  last_message = COALESCE(
    (SELECT content FROM sent_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
    (SELECT content FROM received_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
    c.last_message
  ),
  last_message_at = COALESCE(
    (SELECT created_at FROM sent_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
    (SELECT created_at FROM received_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1),
    c.last_message_at
  );
