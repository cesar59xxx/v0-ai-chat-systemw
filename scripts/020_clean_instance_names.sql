-- Clean trailing and leading spaces from instance_name in conversations table
UPDATE conversations
SET instance_name = TRIM(instance_name)
WHERE instance_name IS NOT NULL AND instance_name != TRIM(instance_name);

-- Clean trailing and leading spaces from name in instances table
UPDATE instances
SET name = TRIM(name)
WHERE name IS NOT NULL AND name != TRIM(name);

-- Clean trailing and leading spaces from instance_name in messages table
UPDATE messages
SET instance_name = TRIM(instance_name)
WHERE instance_name IS NOT NULL AND instance_name != TRIM(instance_name);

-- Add index on instance_name for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_instance_name ON conversations(instance_name);
CREATE INDEX IF NOT EXISTS idx_messages_instance_name ON messages(instance_name);
