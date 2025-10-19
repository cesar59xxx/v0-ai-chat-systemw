-- Adiciona campo para armazenar o UUID da instância do WhatsApp
-- Isso permite mapear entre o UUID do Supabase e o UUID do WhatsApp

ALTER TABLE instances 
ADD COLUMN IF NOT EXISTS whatsapp_instance_id TEXT UNIQUE;

-- Adiciona índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_instances_whatsapp_id 
ON instances(whatsapp_instance_id);

-- Atualiza a função para aceitar tanto nome quanto UUID do WhatsApp
CREATE OR REPLACE FUNCTION insert_message_by_instance_identifier(
  p_instance_identifier TEXT,  -- Pode ser: nome, UUID do WhatsApp, ou UUID do Supabase
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
  -- Tenta buscar a instância por diferentes critérios
  -- 1. Tenta como UUID do Supabase
  -- 2. Tenta como UUID do WhatsApp
  -- 3. Tenta como nome da instância
  
  SELECT id INTO v_instance_id
  FROM instances
  WHERE 
    id::text = p_instance_identifier  -- UUID do Supabase
    OR whatsapp_instance_id = p_instance_identifier  -- UUID do WhatsApp
    OR name = p_instance_identifier  -- Nome da instância
  LIMIT 1;
  
  -- Se não encontrou a instância, retorna erro
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'Instância não encontrada: %. Verifique se o UUID do WhatsApp está vinculado à instância.', p_instance_identifier;
  END IF;
  
  -- Insere a mensagem (o trigger vai criar/atualizar a conversa automaticamente)
  INSERT INTO messages (
    instance_id,
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

-- Comentários explicativos
COMMENT ON COLUMN instances.whatsapp_instance_id IS 'UUID da instância no WhatsApp (diferente do UUID do Supabase)';
COMMENT ON FUNCTION insert_message_by_instance_identifier IS 'Insere mensagem usando nome, UUID do WhatsApp ou UUID do Supabase';
