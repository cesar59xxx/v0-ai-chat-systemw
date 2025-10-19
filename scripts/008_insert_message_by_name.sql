-- Função para inserir mensagem usando o NOME da instância ao invés do UUID
-- Isso simplifica o processo para o n8n, que pode enviar o nome diretamente

-- Remove a função se já existir
DROP FUNCTION IF EXISTS insert_message_by_instance_name;

-- Cria a função que aceita o nome da instância
CREATE OR REPLACE FUNCTION insert_message_by_instance_name(
  p_instance_name TEXT,
  p_sender_number TEXT,
  p_content TEXT,
  p_direction TEXT,
  p_message_id TEXT,
  p_contact_name TEXT,
  p_sender_type TEXT DEFAULT 'customer'
) RETURNS TABLE(
  message_id UUID,
  conversation_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_instance_id UUID;
  v_conversation_id UUID;
  v_message_id UUID;
BEGIN
  -- 1. Buscar o UUID da instância pelo nome
  SELECT id INTO v_instance_id
  FROM instances
  WHERE name = p_instance_name
  LIMIT 1;

  -- Se a instância não existir, retornar erro
  IF v_instance_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::UUID,
      FALSE,
      'Instância não encontrada: ' || p_instance_name;
    RETURN;
  END IF;

  -- 2. Buscar ou criar a conversa
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE instance_id = v_instance_id 
    AND contact_number = p_sender_number
  LIMIT 1;

  -- Se a conversa não existir, criar
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      instance_id,
      contact_number,
      contact_name,
      last_message,
      last_message_at,
      unread_count
    ) VALUES (
      v_instance_id,
      p_sender_number,
      p_contact_name,
      p_content,
      NOW(),
      CASE WHEN p_direction = 'received' THEN 1 ELSE 0 END
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    -- Atualizar a conversa existente
    UPDATE conversations
    SET 
      last_message = p_content,
      last_message_at = NOW(),
      contact_name = COALESCE(p_contact_name, contact_name),
      unread_count = CASE 
        WHEN p_direction = 'received' THEN unread_count + 1 
        ELSE unread_count 
      END,
      updated_at = NOW()
    WHERE id = v_conversation_id;
  END IF;

  -- 3. Inserir a mensagem
  INSERT INTO messages (
    conversation_id,
    instance_id,
    sender_number,
    content,
    direction,
    message_id,
    contact_name,
    sender_type,
    is_read
  ) VALUES (
    v_conversation_id,
    v_instance_id,
    p_sender_number,
    p_content,
    p_direction,
    p_message_id,
    p_contact_name,
    p_sender_type,
    FALSE
  )
  RETURNING id INTO v_message_id;

  -- Retornar sucesso
  RETURN QUERY SELECT 
    v_message_id,
    v_conversation_id,
    TRUE,
    NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, retornar a mensagem de erro
  RETURN QUERY SELECT 
    NULL::UUID,
    NULL::UUID,
    FALSE,
    SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION insert_message_by_instance_name IS 
'Insere uma mensagem usando o NOME da instância ao invés do UUID. Cria/atualiza a conversa automaticamente.';
