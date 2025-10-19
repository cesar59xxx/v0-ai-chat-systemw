-- Melhora a função para dar erros mais claros quando a instância não é encontrada

CREATE OR REPLACE FUNCTION insert_message_by_instance_identifier(
  p_instance_identifier TEXT,
  p_sender_number TEXT,
  p_contact_name TEXT,
  p_content TEXT,
  p_direction TEXT,
  p_message_id TEXT,
  p_created_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instance_id UUID;
  v_conversation_id UUID;
  v_message_id UUID;
BEGIN
  -- Buscar a instância pelo whatsapp_instance_id ou name
  SELECT id INTO v_instance_id
  FROM instances
  WHERE whatsapp_instance_id = p_instance_identifier
     OR name = p_instance_identifier
  LIMIT 1;

  -- Se não encontrou a instância, retornar erro claro
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'Instância não encontrada com identificador: %. Verifique se o UUID do WhatsApp está vinculado à instância.', p_instance_identifier;
  END IF;

  -- Buscar ou criar a conversa
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE instance_id = v_instance_id
    AND contact_number = p_sender_number;

  IF v_conversation_id IS NULL THEN
    -- Criar nova conversa
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
      p_created_at,
      CASE WHEN p_direction = 'received' THEN 1 ELSE 0 END
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    -- Atualizar conversa existente
    UPDATE conversations
    SET last_message = p_content,
        last_message_at = p_created_at,
        contact_name = p_contact_name,
        unread_count = CASE 
          WHEN p_direction = 'received' THEN unread_count + 1 
          ELSE unread_count 
        END,
        updated_at = NOW()
    WHERE id = v_conversation_id;
  END IF;

  -- Inserir a mensagem
  INSERT INTO messages (
    conversation_id,
    instance_id,
    content,
    sender_number,
    contact_name,
    direction,
    message_id,
    sender_type,
    created_at
  ) VALUES (
    v_conversation_id,
    v_instance_id,
    p_content,
    p_sender_number,
    p_contact_name,
    p_direction,
    p_message_id,
    CASE WHEN p_direction = 'sent' THEN 'agent' ELSE 'customer' END,
    p_created_at
  )
  RETURNING id INTO v_message_id;

  -- Retornar sucesso com IDs
  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id,
    'conversation_id', v_conversation_id,
    'instance_id', v_instance_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Retornar erro detalhado
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;
