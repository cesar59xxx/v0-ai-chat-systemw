-- Criar tabelas separadas para mensagens enviadas e recebidas
-- Isso resolve o problema de mensagens sendo sobrescritas

-- Tabela para mensagens ENVIADAS pelo agente/sistema
CREATE TABLE IF NOT EXISTS sent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  instance_name TEXT,
  instance_number TEXT,
  content TEXT NOT NULL,
  sender_type TEXT DEFAULT 'agent',
  sender_number TEXT,
  contact_name TEXT,
  is_read BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para mensagens RECEBIDAS do cliente/lead
CREATE TABLE IF NOT EXISTS received_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  instance_name TEXT,
  instance_number TEXT,
  content TEXT NOT NULL,
  sender_type TEXT DEFAULT 'customer',
  sender_number TEXT,
  contact_name TEXT,
  message_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sent_messages_conversation ON sent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_created ON sent_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_received_messages_conversation ON received_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_received_messages_created ON received_messages(created_at);

-- Desabilitar RLS para desenvolvimento
ALTER TABLE sent_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE received_messages DISABLE ROW LEVEL SECURITY;

-- Conceder permissões
GRANT ALL ON sent_messages TO postgres, anon, authenticated, service_role;
GRANT ALL ON received_messages TO postgres, anon, authenticated, service_role;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sent_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_received_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sent_messages_updated_at ON sent_messages;
CREATE TRIGGER trigger_update_sent_messages_updated_at
  BEFORE UPDATE ON sent_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_sent_messages_updated_at();

DROP TRIGGER IF EXISTS trigger_update_received_messages_updated_at ON received_messages;
CREATE TRIGGER trigger_update_received_messages_updated_at
  BEFORE UPDATE ON received_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_received_messages_updated_at();

-- Trigger para atualizar a conversa quando uma mensagem é enviada
CREATE OR REPLACE FUNCTION update_conversation_on_sent_message()
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

-- Trigger para atualizar a conversa quando uma mensagem é recebida
CREATE OR REPLACE FUNCTION update_conversation_on_received_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    unread_count = unread_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_sent ON sent_messages;
CREATE TRIGGER trigger_update_conversation_on_sent
  AFTER INSERT ON sent_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_sent_message();

DROP TRIGGER IF EXISTS trigger_update_conversation_on_received ON received_messages;
CREATE TRIGGER trigger_update_conversation_on_received
  AFTER INSERT ON received_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_received_message();
