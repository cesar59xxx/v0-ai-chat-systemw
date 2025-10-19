-- Adicionar campos necessários na tabela messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS direction TEXT CHECK (direction IN ('SEND', 'RECEIVED')),
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índice para buscar mensagens por message_id
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);

-- Criar índice para buscar mensagens por direction
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

-- Atualizar a função de atualização de timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON COLUMN messages.direction IS 'Direção da mensagem: SEND (enviada) ou RECEIVED (recebida)';
COMMENT ON COLUMN messages.message_id IS 'ID único da mensagem vindo do WhatsApp';
COMMENT ON COLUMN messages.contact_name IS 'Nome do contato que enviou/recebeu a mensagem';
