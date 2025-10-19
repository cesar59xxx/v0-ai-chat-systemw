-- Script para vincular o UUID do WhatsApp à instância
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'vucovuco' pelo nome da sua instância (se for diferente)
-- 2. Substitua 'da08577c-15ef-45ce-bb8c-f251b1afb466' pelo UUID que o WhatsApp enviou
-- 3. Execute este script no Supabase SQL Editor

-- Atualizar a instância com o UUID do WhatsApp
UPDATE instances 
SET whatsapp_instance_id = 'da08577c-15ef-45ce-bb8c-f251b1afb466'
WHERE name = 'vucovuco';

-- Verificar se foi atualizado corretamente
SELECT 
  id,
  name,
  whatsapp_instance_id,
  status
FROM instances 
WHERE name = 'vucovuco';

-- Se você ver o whatsapp_instance_id preenchido, está pronto para receber mensagens!
