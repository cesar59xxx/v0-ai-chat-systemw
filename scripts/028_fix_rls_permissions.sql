-- Fix RLS permissions for messages and users tables
-- This script creates specific policies to allow anon and authenticated roles
-- to perform INSERT, SELECT, and UPDATE operations

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert messages for anon and authenticated" ON messages;
DROP POLICY IF EXISTS "Allow select messages for anon and authenticated" ON messages;
DROP POLICY IF EXISTS "Allow update messages for anon and authenticated" ON messages;
DROP POLICY IF EXISTS "Allow delete messages for anon and authenticated" ON messages;

-- Create policies for messages table
CREATE POLICY "Allow insert messages for anon and authenticated"
ON messages
FOR INSERT
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow select messages for anon and authenticated"
ON messages
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow update messages for anon and authenticated"
ON messages
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete messages for anon and authenticated"
ON messages
FOR DELETE
TO anon, authenticated
USING (true);

-- Check if users table exists and create policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Enable RLS on users table
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow read users for anon and authenticated" ON users;
    DROP POLICY IF EXISTS "Allow insert users for anon and authenticated" ON users;
    DROP POLICY IF EXISTS "Allow update users for anon and authenticated" ON users;
    
    -- Create policies for users table
    CREATE POLICY "Allow read users for anon and authenticated"
    ON users
    FOR SELECT
    TO anon, authenticated
    USING (true);
    
    CREATE POLICY "Allow insert users for anon and authenticated"
    ON users
    FOR INSERT
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
    
    CREATE POLICY "Allow update users for anon and authenticated"
    ON users
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
    
    RAISE NOTICE 'Policies created for users table';
  ELSE
    RAISE NOTICE 'Users table does not exist, skipping';
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify RLS is enabled
DO $$
DECLARE
  messages_rls boolean;
  users_rls boolean;
BEGIN
  SELECT relrowsecurity INTO messages_rls FROM pg_class WHERE relname = 'messages';
  RAISE NOTICE 'RLS enabled on messages: %', messages_rls;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    SELECT relrowsecurity INTO users_rls FROM pg_class WHERE relname = 'users';
    RAISE NOTICE 'RLS enabled on users: %', users_rls;
  END IF;
END $$;
