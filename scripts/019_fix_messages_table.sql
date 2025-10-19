-- Adiciona coluna instance_number na tabela messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS instance_number TEXT;

-- Cria índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_messages_instance_number 
ON messages(instance_number);

-- Atualiza mensagens existentes com o instance_number baseado no instance_id
UPDATE messages m
SET instance_number = i.phone_number
FROM instances i
WHERE m.instance_id = i.id
AND m.instance_number IS NULL;

-- Cria função para preencher automaticamente instance_number
CREATE OR REPLACE FUNCTION fill_message_instance_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Se instance_number não foi fornecido, tenta preencher
  IF NEW.instance_number IS NULL THEN
    -- Tenta buscar pelo instance_id
    IF NEW.instance_id IS NOT NULL THEN
      SELECT phone_number INTO NEW.instance_number
      FROM instances
      WHERE id = NEW.instance_id;
    END IF;
    
    -- Se ainda não encontrou, tenta pelo instance_name
    IF NEW.instance_number IS NULL AND NEW.instance_name IS NOT NULL THEN
      SELECT phone_number INTO NEW.instance_number
      FROM instances
      WHERE name = NEW.instance_name
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger para preencher automaticamente
DROP TRIGGER IF EXISTS trigger_fill_message_instance_number ON messages;
CREATE TRIGGER trigger_fill_message_instance_number
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION fill_message_instance_number();

-- Atualiza conversas existentes com instance_number
UPDATE conversations c
SET instance_number = i.phone_number
FROM instances i
WHERE c.instance_id = i.id
AND c.instance_number IS NULL;
