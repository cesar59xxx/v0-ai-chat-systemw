-- Migrar mensagens antigas para as novas tabelas separadas

-- 1. Migrar mensagens enviadas da tabela messages para sent_messages
INSERT INTO sent_messages (
  id,
  conversation_id,
  instance_name,
  instance_number,
  instance_phone_number,
  content,
  sender_type,
  sender_number,
  contact_name,
  message_id,
  is_read,
  created_at,
  updated_at
)
SELECT 
  id,
  conversation_id,
  instance_name,
  instance_number,
  instance_phone_number,
  content,
  sender_type,
  sender_number,
  contact_name,
  message_id,
  is_read,
  created_at,
  updated_at
FROM messages
WHERE direction IN ('SEND', 'sent', 'out')
  OR sender_type IN ('agent', 'system', 'bot', 'user')
ON CONFLICT (id) DO NOTHING;

-- 2. Migrar mensagens recebidas da tabela messages para received_messages
INSERT INTO received_messages (
  id,
  conversation_id,
  instance_name,
  instance_number,
  instance_phone_number,
  content,
  sender_type,
  sender_number,
  contact_name,
  message_id,
  is_read,
  created_at,
  updated_at
)
SELECT 
  id,
  conversation_id,
  instance_name,
  instance_number,
  instance_phone_number,
  content,
  sender_type,
  sender_number,
  contact_name,
  message_id,
  is_read,
  created_at,
  updated_at
FROM messages
WHERE direction IN ('RECEIVED', 'received', 'in')
  OR sender_type IN ('customer', 'client', 'contact')
ON CONFLICT (id) DO NOTHING;

-- 3. Criar mensagens recebidas baseadas no last_message das conversas que não têm mensagens
INSERT INTO received_messages (
  conversation_id,
  instance_name,
  instance_number,
  content,
  sender_type,
  sender_number,
  contact_name,
  is_read,
  created_at,
  updated_at
)
SELECT 
  c.id as conversation_id,
  c.instance_name,
  c.instance_number,
  c.last_message as content,
  'customer' as sender_type,
  c.contact_number as sender_number,
  c.contact_name,
  false as is_read,
  c.last_message_at as created_at,
  c.last_message_at as updated_at
FROM conversations c
WHERE c.last_message IS NOT NULL 
  AND c.last_message != ''
  AND NOT EXISTS (
    SELECT 1 FROM received_messages rm 
    WHERE rm.conversation_id = c.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM sent_messages sm 
    WHERE sm.conversation_id = c.id 
      AND sm.content = c.last_message
  );

-- 4. Log de migração
DO $$
DECLARE
  sent_count INTEGER;
  received_count INTEGER;
  from_last_message_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sent_count FROM sent_messages;
  SELECT COUNT(*) INTO received_count FROM received_messages;
  SELECT COUNT(*) INTO from_last_message_count 
  FROM conversations 
  WHERE last_message IS NOT NULL 
    AND last_message != '';
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '- Sent messages: %', sent_count;
  RAISE NOTICE '- Received messages: %', received_count;
  RAISE NOTICE '- Conversations with last_message: %', from_last_message_count;
END $$;
