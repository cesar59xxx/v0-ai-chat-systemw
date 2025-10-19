-- Add instance_number column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS instance_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_instance_number ON messages(instance_number);

-- Create or replace function to auto-populate instance_number in messages
CREATE OR REPLACE FUNCTION populate_message_instance_number()
RETURNS TRIGGER AS $$
DECLARE
  v_instance_number TEXT;
  v_instance_id UUID;
BEGIN
  -- If instance_number is already set, use it
  IF NEW.instance_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Try to get instance info from conversation if conversation_id is set
  IF NEW.conversation_id IS NOT NULL THEN
    SELECT instance_number, instance_id INTO v_instance_number, v_instance_id
    FROM conversations
    WHERE id = NEW.conversation_id
    LIMIT 1;
    
    IF v_instance_number IS NOT NULL THEN
      NEW.instance_number := v_instance_number;
      NEW.instance_id := COALESCE(NEW.instance_id, v_instance_id);
      NEW.instance_name := COALESCE(NEW.instance_name, v_instance_number);
      RETURN NEW;
    END IF;
  END IF;

  -- Try to get from instance_id if set
  IF NEW.instance_id IS NOT NULL THEN
    SELECT phone_number INTO v_instance_number
    FROM instances
    WHERE id = NEW.instance_id
    LIMIT 1;
    
    IF v_instance_number IS NOT NULL THEN
      NEW.instance_number := v_instance_number;
      NEW.instance_name := COALESCE(NEW.instance_name, v_instance_number);
      RETURN NEW;
    END IF;
  END IF;

  -- Try to get from instance_name if set
  IF NEW.instance_name IS NOT NULL THEN
    SELECT phone_number, id INTO v_instance_number, v_instance_id
    FROM instances
    WHERE name = NEW.instance_name OR phone_number = NEW.instance_name
    LIMIT 1;
    
    IF v_instance_number IS NOT NULL THEN
      NEW.instance_number := v_instance_number;
      NEW.instance_id := COALESCE(NEW.instance_id, v_instance_id);
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for messages
DROP TRIGGER IF EXISTS trigger_populate_message_instance_number ON messages;
CREATE TRIGGER trigger_populate_message_instance_number
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION populate_message_instance_number();

-- Backfill existing messages with instance_number
UPDATE messages m
SET instance_number = i.phone_number
FROM instances i
WHERE m.instance_id = i.id
  AND m.instance_number IS NULL;

-- Backfill from conversation if still null
UPDATE messages m
SET instance_number = c.instance_number,
    instance_id = COALESCE(m.instance_id, c.instance_id)
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.instance_number IS NULL
  AND c.instance_number IS NOT NULL;
