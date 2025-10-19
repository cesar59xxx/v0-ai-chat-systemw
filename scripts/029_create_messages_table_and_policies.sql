-- Script para criar tabela messages e configurar RLS
-- Conecte-se ao Supabase usando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

-- 1. Criar tabela messages se não existir
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid,
  instance_id uuid,
  instance_number text,
  instance_name text,
  whatsapp_instance_id text,
  content text,
  sender_type text,
  direction text,
  is_read boolean DEFAULT false,
  sender_number text,
  contact_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Remover foreign key problemática se existir
DO $$ 
BEGIN
  -- Verificar e remover constraint de foreign key para users se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%messages%user%' 
    AND table_name = 'messages'
  ) THEN
    EXECUTE 'ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey';
  END IF;
  
  -- Remover coluna user_id se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE messages DROP COLUMN IF EXISTS user_id;
  END IF;
END $$;

-- 3. Ativar RLS na tabela messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Allow insert messages for anon and authenticated" ON messages;
DROP POLICY IF EXISTS "Allow select messages for anon and authenticated" ON messages;
DROP POLICY IF EXISTS "Allow update messages for anon and authenticated" ON messages;
DROP POLICY IF EXISTS "Allow delete messages for anon and authenticated" ON messages;

-- 5. Criar policies para messages
CREATE POLICY "Allow insert messages for anon and authenticated"
ON messages FOR INSERT TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow select messages for anon and authenticated"
ON messages FOR SELECT TO anon, authenticated 
USING (true);

CREATE POLICY "Allow update messages for anon and authenticated"
ON messages FOR UPDATE TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete messages for anon and authenticated"
ON messages FOR DELETE TO anon, authenticated 
USING (true);

-- 6. Configurar policies para users se a tabela existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Ativar RLS na tabela users
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Remover policy antiga se existir
    DROP POLICY IF EXISTS "Allow read users for anon and authenticated" ON users;
    
    -- Criar policy para users
    CREATE POLICY "Allow read users for anon and authenticated"
    ON users FOR SELECT TO anon, authenticated 
    USING (true);
  END IF;
END $$;

-- 7. Conceder permissões necessárias
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;
GRANT SELECT ON users TO anon, authenticated;

-- 8. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_instance_name ON messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Verificação final
SELECT 
  'messages' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'messages'
UNION ALL
SELECT 
  'users' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'users';
