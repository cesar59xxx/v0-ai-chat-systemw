-- Add whatsapp_instance_id column to messages table to satisfy existing trigger
-- This is a temporary workaround until the trigger can be properly removed

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS whatsapp_instance_id TEXT;

-- Add comment explaining this is temporary
COMMENT ON COLUMN messages.whatsapp_instance_id IS 'Temporary column to satisfy legacy trigger - should be removed once trigger is fixed';
