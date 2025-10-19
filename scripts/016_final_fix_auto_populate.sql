-- Script final para permitir que o n8n insira mensagens usando apenas instance_name
-- Este script cria triggers que preenchem automaticamente instance_id e conversation_id

-- Passo 1: Tornar os campos instance_id e conversation_id NULLABLE temporariamente
ALTER TABLE messages 
  ALTER COLUMN instance_id DROP NOT NULL,
  ALTER COLUMN conversation_id DROP NOT NULL;

-- Passo 2: Criar função que preenche automaticamente os IDs baseado no instance_name
CREATE OR REPLACE FUNCTION auto_populate_message_ids()
RETURNS TRIGGER AS $$
DECLARE
  v_instance_id UUID;
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  -- Se instance_name foi fornecido mas instance_id não
  IF NEW.instance_name IS NOT NULL AND NEW.instance_id IS NULL THEN
    
    -- Buscar a instância pelo nome
    SELECT id, user_id INTO v_instance_id, v_user_id
    FROM instances
    WHERE name = NEW.instance_name
    LIMIT 1;
    
    -- Se não encontrou a instância, criar uma nova com user_id padrão
    IF v_instance_id IS NULL THEN
      -- Pegar o primeiro user_id disponível ou criar um padrão
      SELECT id INTO v_user_id FROM profiles LIMIT 1;
      
      -- Se não tem nenhum usuário, usar um UUID padrão
      IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
      END IF;
      
      -- Criar a instância
      INSERT INTO instances (name, user_id, status, created_at, updated_at)
      VALUES (NEW.instance_name, v_user_id, 'active', NOW(), NOW())
      RETURNING id INTO v_instance_id;
      
      RAISE NOTICE 'Nova instância criada: % com ID: %', NEW.instance_name, v_instance_id;
    END IF;
    
    -- Atualizar o instance_id da mensagem
    NEW.instance_id := v_instance_id;
    
    -- Buscar ou criar a conversa
    IF NEW.sender_number IS NOT NULL THEN
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
        ) VALUES (
          v_instance_id,
          NEW.sender_number,
          COALESCE(NEW.contact_name, 'Desconhecido'),
          NEW.content,
          NOW(),
          CASE WHEN NEW.direction = 'received' THEN 1 ELSE 0 END,
          NOW(),
          NOW()
        )
        RETURNING id INTO v_conversation_id;
        
        RAISE NOTICE 'Nova conversa criada com ID: %', v_conversation_id;
      ELSE
        -- Atualizar a conversa existente
        UPDATE conversations
        SET 
          last_message = NEW.content,
          last_message_at = NOW(),
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passo 3: Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_auto_populate_message_ids ON messages;

-- Passo 4: Criar novo trigger
CREATE TRIGGER trigger_auto_populate_message_ids
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_message_ids();

-- Passo 5: Garantir que RLS está desabilitado para permitir inserções diretas
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- Passo 6: Criar política RLS para instances (usuários só veem suas próprias instâncias)
DROP POLICY IF EXISTS "Users can view their own instances" ON instances;
CREATE POLICY "Users can view their own instances"
  ON instances FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own instances" ON instances;
CREATE POLICY "Users can insert their own instances"
  ON instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own instances" ON instances;
CREATE POLICY "Users can update their own instances"
  ON instances FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own instances" ON instances;
CREATE POLICY "Users can delete their own instances"
  ON instances FOR DELETE
  USING (auth.uid() = user_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Configuração concluída com sucesso!';
  RAISE NOTICE '✅ O n8n agora pode inserir mensagens usando apenas instance_name';
  RAISE NOTICE '✅ Os campos instance_id e conversation_id serão preenchidos automaticamente';
END $$;
