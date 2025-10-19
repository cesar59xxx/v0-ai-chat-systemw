-- Script para simplificar o uso de nome da instância ao invés de UUID
-- O n8n só precisa enviar o campo 'instance_name' e tudo é resolvido automaticamente

-- Passo 1: Garantir que o campo instance_name existe e é indexado
CREATE INDEX IF NOT EXISTS idx_messages_instance_name ON messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_instances_name_unique ON instances(name);

-- Passo 2: Criar função que preenche automaticamente instance_id e conversation_id
-- baseado no instance_name
CREATE OR REPLACE FUNCTION auto_fill_message_ids()
RETURNS TRIGGER AS $$
DECLARE
  v_instance_id UUID;
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  -- Se instance_name foi fornecido, buscar o instance_id
  IF NEW.instance_name IS NOT NULL THEN
    -- Buscar a instância pelo nome
    SELECT id, user_id INTO v_instance_id, v_user_id
    FROM instances
    WHERE name = NEW.instance_name
    LIMIT 1;
    
    -- Se não encontrou a instância, criar uma nova
    IF v_instance_id IS NULL THEN
      -- Criar uma nova instância com um user_id padrão (primeiro usuário do sistema)
      SELECT id INTO v_user_id FROM auth.users LIMIT 1;
      
      INSERT INTO instances (name, user_id, status, created_at, updated_at)
      VALUES (NEW.instance_name, v_user_id, 'active', NOW(), NOW())
      RETURNING id INTO v_instance_id;
    END IF;
    
    -- Atualizar o instance_id da mensagem
    NEW.instance_id := v_instance_id;
    
    -- Buscar ou criar a conversa
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE instance_id = v_instance_id
      AND contact_number = NEW.sender_number
    LIMIT 1;
    
    -- Se não encontrou a conversa, criar uma nova
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
      )
      VALUES (
        v_instance_id,
        NEW.sender_number,
        NEW.contact_name,
        NEW.content,
        NEW.created_at,
        CASE WHEN NEW.direction = 'received' THEN 1 ELSE 0 END,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_conversation_id;
    ELSE
      -- Atualizar a conversa existente
      UPDATE conversations
      SET
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        contact_name = COALESCE(NEW.contact_name, contact_name),
        unread_count = CASE 
          WHEN NEW.direction = 'received' THEN unread_count + 1 
          ELSE unread_count 
        END,
        updated_at = NOW()
      WHERE id = v_conversation_id;
    END IF;
    
    -- Atualizar o conversation_id da mensagem
    NEW.conversation_id := v_conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 3: Remover trigger antigo se existir e criar novo
DROP TRIGGER IF EXISTS trigger_auto_fill_message_ids ON messages;

CREATE TRIGGER trigger_auto_fill_message_ids
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_message_ids();

-- Passo 4: Comentários explicativos
COMMENT ON FUNCTION auto_fill_message_ids() IS 
'Preenche automaticamente instance_id e conversation_id baseado no instance_name. 
Se a instância não existir, cria uma nova. Se a conversa não existir, cria uma nova.';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Configuração concluída! Agora o n8n só precisa enviar o campo instance_name';
  RAISE NOTICE '📝 Campos obrigatórios: instance_name, sender_number, content, direction, created_at';
  RAISE NOTICE '📝 Campos opcionais: contact_name, message_id';
END $$;
