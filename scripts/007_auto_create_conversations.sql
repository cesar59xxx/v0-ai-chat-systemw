-- Script para criar triggers que automatizam a criação/atualização de conversas
-- Agora o n8n só precisa inserir na tabela messages, e o trigger cuida do resto!

-- 1. Função para criar/atualizar conversa automaticamente
CREATE OR REPLACE FUNCTION auto_manage_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_contact_number TEXT;
  v_contact_name TEXT;
  v_instance_id UUID;
BEGIN
  -- Extrair dados da mensagem
  v_instance_id := NEW.instance_id;
  v_contact_number := NEW.sender_number;
  v_contact_name := NEW.contact_name;

  -- Buscar ou criar a conversa
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE instance_id = v_instance_id 
    AND contact_number = v_contact_number;

  -- Se não existe, criar nova conversa
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      instance_id,
      contact_number,
      contact_name,
      last_message,
      last_message_at,
      unread_count,
      created_at,
      updated_at
    ) VALUES (
      v_instance_id,
      v_contact_number,
      COALESCE(v_contact_name, v_contact_number),
      NEW.content,
      NEW.created_at,
      CASE WHEN NEW.sender_type = 'customer' THEN 1 ELSE 0 END,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    -- Se existe, atualizar
    UPDATE conversations
    SET 
      contact_name = COALESCE(v_contact_name, contact_name),
      last_message = NEW.content,
      last_message_at = NEW.created_at,
      unread_count = CASE 
        WHEN NEW.sender_type = 'customer' THEN unread_count + 1 
        ELSE unread_count 
      END,
      updated_at = NOW()
    WHERE id = v_conversation_id;
  END IF;

  -- Atualizar o conversation_id da mensagem
  NEW.conversation_id := v_conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger BEFORE INSERT na tabela messages
DROP TRIGGER IF EXISTS trigger_auto_manage_conversation ON messages;
CREATE TRIGGER trigger_auto_manage_conversation
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_manage_conversation();

-- 3. Tornar conversation_id opcional (pode ser NULL no INSERT, o trigger preenche)
ALTER TABLE messages ALTER COLUMN conversation_id DROP NOT NULL;

-- 4. Adicionar constraint para garantir que conversation_id seja preenchido após o trigger
-- (Isso garante integridade mas permite NULL temporário durante o INSERT)
ALTER TABLE messages ADD CONSTRAINT check_conversation_id_after_trigger 
  CHECK (conversation_id IS NOT NULL) NOT VALID;

COMMENT ON TRIGGER trigger_auto_manage_conversation ON messages IS 
  'Cria ou atualiza automaticamente a conversa quando uma mensagem é inserida';
