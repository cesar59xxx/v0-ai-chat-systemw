-- ============================================
-- SIMPLIFICAÇÃO COMPLETA - USA APENAS NOME DA INSTÂNCIA
-- ============================================
-- Este script remove toda a complexidade de UUIDs e usa apenas o nome da instância
-- que o WhatsApp já envia. Muito mais simples e direto!

-- 1. Remover campos desnecessários
ALTER TABLE instances DROP COLUMN IF EXISTS whatsapp_instance_id;
ALTER TABLE messages DROP COLUMN IF EXISTS whatsapp_instance_id;

-- 2. Adicionar campo instance_name na tabela messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS instance_name TEXT;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_messages_instance_name ON messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_instances_name ON instances(name);

-- 4. Criar função que busca ou cria instância pelo nome
CREATE OR REPLACE FUNCTION get_or_create_instance_by_name(p_instance_name TEXT)
RETURNS UUID AS $$
DECLARE
  v_instance_id UUID;
  v_default_user_id UUID;
BEGIN
  -- Buscar instância pelo nome
  SELECT id INTO v_instance_id
  FROM instances
  WHERE name = p_instance_name
  LIMIT 1;
  
  -- Se não encontrou, criar uma nova instância
  IF v_instance_id IS NULL THEN
    -- Pegar o primeiro usuário disponível (ou você pode criar um usuário padrão)
    SELECT id INTO v_default_user_id
    FROM auth.users
    LIMIT 1;
    
    -- Se não tem usuário, usar um UUID fixo (você pode ajustar isso)
    IF v_default_user_id IS NULL THEN
      v_default_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;
    
    -- Criar nova instância
    INSERT INTO instances (name, user_id, status, created_at, updated_at)
    VALUES (p_instance_name, v_default_user_id, 'active', NOW(), NOW())
    RETURNING id INTO v_instance_id;
    
    RAISE NOTICE 'Nova instância criada: % com ID: %', p_instance_name, v_instance_id;
  END IF;
  
  RETURN v_instance_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger que converte instance_name para instance_id automaticamente
CREATE OR REPLACE FUNCTION convert_instance_name_to_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se instance_name foi fornecido, buscar/criar o instance_id
  IF NEW.instance_name IS NOT NULL THEN
    NEW.instance_id := get_or_create_instance_by_name(NEW.instance_name);
  END IF;
  
  -- Se ainda não tem instance_id, dar erro claro
  IF NEW.instance_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível determinar o instance_id. Forneça instance_name ou instance_id.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_convert_instance_name ON messages;

-- Criar novo trigger
CREATE TRIGGER trigger_convert_instance_name
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION convert_instance_name_to_id();

-- 6. Garantir que o trigger de criar conversa ainda funciona
-- (já existe do script anterior, mas vamos garantir que está ativo)
CREATE OR REPLACE FUNCTION create_or_update_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Buscar ou criar conversa
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE instance_id = NEW.instance_id
    AND contact_number = NEW.sender_number;
  
  IF v_conversation_id IS NULL THEN
    -- Criar nova conversa
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
      NEW.instance_id,
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
    -- Atualizar conversa existente
    UPDATE conversations
    SET last_message = NEW.content,
        last_message_at = NEW.created_at,
        contact_name = COALESCE(NEW.contact_name, contact_name),
        unread_count = CASE 
          WHEN NEW.direction = 'received' THEN unread_count + 1 
          ELSE unread_count 
        END,
        updated_at = NOW()
    WHERE id = v_conversation_id;
  END IF;
  
  -- Atualizar conversation_id na mensagem
  NEW.conversation_id := v_conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger de conversa
DROP TRIGGER IF EXISTS trigger_create_conversation ON messages;
CREATE TRIGGER trigger_create_conversation
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_or_update_conversation();

-- 7. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Simplificação completa! Agora você pode:';
  RAISE NOTICE '1. Enviar mensagens usando apenas o campo instance_name';
  RAISE NOTICE '2. O sistema busca/cria a instância automaticamente';
  RAISE NOTICE '3. Não precisa mais de UUIDs ou vinculação manual';
  RAISE NOTICE '';
  RAISE NOTICE 'Exemplo de JSON para o n8n:';
  RAISE NOTICE '{';
  RAISE NOTICE '  "instance_name": "vucovuco",';
  RAISE NOTICE '  "content": "Olá!",';
  RAISE NOTICE '  "sender_number": "5511999999999@s.whatsapp.net",';
  RAISE NOTICE '  "sender_type": "customer",';
  RAISE NOTICE '  "direction": "received",';
  RAISE NOTICE '  "contact_name": "João"';
  RAISE NOTICE '}';
END $$;
