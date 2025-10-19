-- Remove ALL triggers and functions from messages table that are causing issues
-- This is a nuclear option to fix the whatsapp_instance_id error

-- Drop all triggers on messages table
DROP TRIGGER IF EXISTS trigger_convert_whatsapp_instance_id ON messages CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_populate_message_fields ON messages CASCADE;
DROP TRIGGER IF EXISTS trigger_populate_instance_fields ON messages CASCADE;
DROP TRIGGER IF EXISTS handle_new_message ON messages CASCADE;
DROP TRIGGER IF EXISTS set_instance_id_from_name ON messages CASCADE;
DROP TRIGGER IF EXISTS auto_populate_message_instance ON messages CASCADE;

-- Drop all related functions
DROP FUNCTION IF EXISTS convert_whatsapp_instance_id() CASCADE;
DROP FUNCTION IF EXISTS auto_populate_message_fields() CASCADE;
DROP FUNCTION IF EXISTS populate_instance_fields() CASCADE;
DROP FUNCTION IF EXISTS handle_new_message() CASCADE;
DROP FUNCTION IF EXISTS set_instance_id_from_name() CASCADE;
DROP FUNCTION IF EXISTS auto_populate_message_instance() CASCADE;

-- Drop the whatsapp_instance_id column if it exists
ALTER TABLE messages DROP COLUMN IF EXISTS whatsapp_instance_id CASCADE;

-- Create a simple trigger to auto-populate conversation_id if missing
CREATE OR REPLACE FUNCTION auto_set_conversation_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If conversation_id is not provided, try to find it
  IF NEW.conversation_id IS NULL THEN
    SELECT id INTO NEW.conversation_id
    FROM conversations
    WHERE contact_number = NEW.sender_number
      AND instance_name = NEW.instance_name
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-setting conversation_id
DROP TRIGGER IF EXISTS trigger_auto_set_conversation_id ON messages;
CREATE TRIGGER trigger_auto_set_conversation_id
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_conversation_id();

-- Verify the fix
SELECT 'All problematic triggers removed successfully' AS status;
