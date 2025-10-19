-- Adiciona campo whatsapp_instance_id na tabela messages
-- e cria trigger para converter automaticamente para instance_id

-- Adicionar coluna whatsapp_instance_id na tabela messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS whatsapp_instance_id TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_instance_id 
ON messages(whatsapp_instance_id);

-- Criar função que converte whatsapp_instance_id para instance_id
CREATE OR REPLACE FUNCTION convert_whatsapp_instance_id()
RETURNS TRIGGER AS $$
DECLARE
  v_instance_id UUID;
BEGIN
  -- Se whatsapp_instance_id foi fornecido mas instance_id não
  IF NEW.whatsapp_instance_id IS NOT NULL AND NEW.instance_id IS NULL THEN
    -- Buscar o instance_id correspondente
    SELECT id INTO v_instance_id
    FROM instances
    WHERE whatsapp_instance_id = NEW.whatsapp_instance_id
    LIMIT 1;
    
    -- Se encontrou, usar esse instance_id
    IF v_instance_id IS NOT NULL THEN
      NEW.instance_id := v_instance_id;
    ELSE
      -- Se não encontrou, lançar erro claro
      RAISE EXCEPTION 'Instância não encontrada para whatsapp_instance_id: %. Vincule o UUID do WhatsApp primeiro na página de Diagnóstico.', NEW.whatsapp_instance_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa antes de inserir
DROP TRIGGER IF EXISTS trigger_convert_whatsapp_instance_id ON messages;
CREATE TRIGGER trigger_convert_whatsapp_instance_id
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION convert_whatsapp_instance_id();

-- Comentários para documentação
COMMENT ON COLUMN messages.whatsapp_instance_id IS 'UUID da instância do WhatsApp. Será convertido automaticamente para instance_id pelo trigger.';
COMMENT ON FUNCTION convert_whatsapp_instance_id() IS 'Converte whatsapp_instance_id para instance_id antes de inserir mensagem.';
