-- Refatoração para usar phone_number como identificador primário de instâncias
-- Mantém compatibilidade retroativa com instance_name

-- Passo 1: Adicionar índice único em phone_number para busca rápida
CREATE UNIQUE INDEX IF NOT EXISTS idx_instances_phone_number 
ON instances(phone_number) 
WHERE phone_number IS NOT NULL;

-- Passo 2: Adicionar campo phone_number nas tabelas de mensagens e conversas para cache
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS instance_phone_number TEXT;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS instance_phone_number TEXT;

-- Passo 3: Criar função melhorada que busca instância por phone_number, whatsapp_id ou name
CREATE OR REPLACE FUNCTION find_instance_by_identifier(
  p_identifier TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance_id UUID;
BEGIN
  -- Busca por phone_number (prioridade 1)
  -- Busca por whatsapp_instance_id (prioridade 2)
  -- Busca por name (prioridade 3 - compatibilidade retroativa)
  
  SELECT id INTO v_instance_id
  FROM instances
  WHERE 
    phone_number = p_identifier
    OR whatsapp_instance_id = p_identifier
    OR name = p_identifier
    OR id::text = p_identifier
  LIMIT 1;
  
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'Instância não encontrada para identificador: %. Use phone_number, whatsapp_instance_id ou name.', p_identifier;
  END IF;
  
  RETURN v_instance_id;
END;
$$;

-- Passo 4: Atualizar função de auto-populate para usar phone_number
CREATE OR REPLACE FUNCTION auto_populate_message_ids()
RETURNS TRIGGER AS $$
DECLARE
  v_instance_id UUID;
  v_instance_phone TEXT;
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  -- Se instance_name OU instance_phone_number foi fornecido mas instance_id não
  IF (NEW.instance_name IS NOT NULL OR NEW.instance_phone_number IS NOT NULL) 
     AND NEW.instance_id IS NULL THEN
    
    -- Priorizar phone_number sobre name
    IF NEW.instance_phone_number IS NOT NULL THEN
      -- Buscar a instância pelo phone_number
      SELECT id, phone_number, user_id INTO v_instance_id, v_instance_phone, v_user_id
      FROM instances
      WHERE phone_number = NEW.instance_phone_number
      LIMIT 1;
    ELSIF NEW.instance_name IS NOT NULL THEN
      -- Fallback: buscar pelo name (compatibilidade retroativa)
      SELECT id, phone_number, user_id INTO v_instance_id, v_instance_phone, v_user_id
      FROM instances
      WHERE name = NEW.instance_name
      LIMIT 1;
    END IF;
    
    -- Se não encontrou a instância, criar uma nova
    IF v_instance_id IS NULL THEN
      -- Pegar o primeiro user_id disponível
      SELECT id INTO v_user_id FROM profiles LIMIT 1;
      
      IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
      END IF;
      
      -- Criar a instância com phone_number se fornecido
      INSERT INTO instances (
        name, 
        phone_number, 
        user_id, 
        status, 
        created_at, 
        updated_at
      )
      VALUES (
        COALESCE(NEW.instance_name, NEW.instance_phone_number, 'auto_' || gen_random_uuid()::text),
        NEW.instance_phone_number,
        v_user_id,
        'active',
        NOW(),
        NOW()
      )
      RETURNING id, phone_number INTO v_instance_id, v_instance_phone;
      
      RAISE NOTICE 'Nova instância criada com phone: % e ID: %', v_instance_phone, v_instance_id;
    END IF;
    
    -- Atualizar os campos da mensagem
    NEW.instance_id := v_instance_id;
    NEW.instance_phone_number := v_instance_phone;
    
    -- Buscar ou criar a conversa
    IF NEW.sender_number IS NOT NULL THEN
      SELECT id INTO v_conversation_id
      FROM conversations
      WHERE instance_id = v_instance_id 
        AND contact_number = NEW.sender_number
      LIMIT 1;
      
      IF v_conversation_id IS NULL THEN
        -- Criar nova conversa
        INSERT INTO conversations (
          instance_id,
          instance_phone_number,
          contact_number,
          contact_name,
          last_message,
          last_message_at,
          unread_count,
          created_at,
          updated_at
        ) VALUES (
          v_instance_id,
          v_instance_phone,
          NEW.sender_number,
          COALESCE(NEW.contact_name, 'Desconhecido'),
          NEW.content,
          NOW(),
          CASE WHEN NEW.direction = 'received' THEN 1 ELSE 0 END,
          NOW(),
          NOW()
        )
        RETURNING id INTO v_conversation_id;
        
        RAISE NOTICE 'Nova conversa criada para phone: % com ID: %', v_instance_phone, v_conversation_id;
      ELSE
        -- Atualizar conversa existente
        UPDATE conversations
        SET 
          last_message = NEW.content,
          last_message_at = NOW(),
          contact_name = COALESCE(NEW.contact_name, contact_name),
          instance_phone_number = v_instance_phone,
          unread_count = CASE 
            WHEN NEW.direction = 'received' THEN unread_count + 1 
            ELSE unread_count 
          END,
          updated_at = NOW()
        WHERE id = v_conversation_id;
      END IF;
      
      NEW.conversation_id := v_conversation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 5: Recriar trigger
DROP TRIGGER IF EXISTS trigger_auto_populate_message_ids ON messages;
CREATE TRIGGER trigger_auto_populate_message_ids
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_message_ids();

-- Passo 6: Criar função para inserir mensagem por phone_number
CREATE OR REPLACE FUNCTION insert_message_by_phone_number(
  p_phone_number TEXT,
  p_content TEXT,
  p_sender_number TEXT,
  p_sender_type TEXT DEFAULT 'customer',
  p_direction TEXT DEFAULT 'received',
  p_message_id TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance_id UUID;
  v_message_id UUID;
BEGIN
  -- Buscar instância por phone_number
  v_instance_id := find_instance_by_identifier(p_phone_number);
  
  -- Inserir mensagem (trigger vai criar/atualizar conversa)
  INSERT INTO messages (
    instance_id,
    instance_phone_number,
    content,
    sender_number,
    sender_type,
    direction,
    message_id,
    contact_name,
    is_read,
    created_at
  ) VALUES (
    v_instance_id,
    p_phone_number,
    p_content,
    p_sender_number,
    p_sender_type,
    p_direction,
    p_message_id,
    p_contact_name,
    CASE WHEN p_direction = 'received' THEN false ELSE true END,
    NOW()
  )
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;

-- Passo 7: Atualizar dados existentes com phone_number
UPDATE conversations c
SET instance_phone_number = i.phone_number
FROM instances i
WHERE c.instance_id = i.id
  AND c.instance_phone_number IS NULL
  AND i.phone_number IS NOT NULL;

UPDATE messages m
SET instance_phone_number = i.phone_number
FROM instances i
WHERE m.instance_id = i.id
  AND m.instance_phone_number IS NULL
  AND i.phone_number IS NOT NULL;

-- Comentários
COMMENT ON COLUMN conversations.instance_phone_number IS 'Cache do phone_number da instância para queries rápidas';
COMMENT ON COLUMN messages.instance_phone_number IS 'Cache do phone_number da instância para queries rápidas';
COMMENT ON FUNCTION find_instance_by_identifier IS 'Busca instância por phone_number (prioridade), whatsapp_id ou name';
COMMENT ON FUNCTION insert_message_by_phone_number IS 'Insere mensagem usando phone_number da instância';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Refatoração concluída!';
  RAISE NOTICE '✅ Sistema agora usa phone_number como identificador primário';
  RAISE NOTICE '✅ Mantém compatibilidade com instance_name e whatsapp_instance_id';
  RAISE NOTICE '✅ Índice único criado em instances.phone_number';
END $$;
