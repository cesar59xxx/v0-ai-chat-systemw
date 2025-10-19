-- Disable RLS for development
-- This allows full access to all tables without authentication

-- Disable RLS on all tables
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on messages table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.messages';
    END LOOP;
    
    -- Drop all policies on conversations table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'conversations' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.conversations';
    END LOOP;
    
    -- Drop all policies on instances table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'instances' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.instances';
    END LOOP;
    
    -- Drop all policies on ai_agents table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ai_agents' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.ai_agents';
    END LOOP;
    
    -- Drop all policies on profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Grant full access to authenticated and anon roles
GRANT ALL ON public.messages TO authenticated, anon;
GRANT ALL ON public.conversations TO authenticated, anon;
GRANT ALL ON public.instances TO authenticated, anon;
GRANT ALL ON public.ai_agents TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated, anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
