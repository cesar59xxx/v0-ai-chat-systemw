-- Script para criar policies RLS que permitem acesso às tabelas
-- Resolve o erro "permission denied for table users"

-- ============================================
-- 1. HABILITAR RLS NAS TABELAS
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. REMOVER POLICIES EXISTENTES (se houver)
-- ============================================

DROP POLICY IF EXISTS "Allow insert for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow select for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow update for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow delete for anon and authenticated users" ON messages;

DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON conversations;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON instances;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON ai_agents;

-- ============================================
-- 3. CRIAR POLICIES PARA MESSAGES
-- ============================================

-- Permitir INSERT para anon e authenticated
CREATE POLICY "Allow insert for anon and authenticated users"
ON messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir SELECT para anon e authenticated
CREATE POLICY "Allow select for anon and authenticated users"
ON messages
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir UPDATE para anon e authenticated
CREATE POLICY "Allow update for anon and authenticated users"
ON messages
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Permitir DELETE para anon e authenticated
CREATE POLICY "Allow delete for anon and authenticated users"
ON messages
FOR DELETE
TO anon, authenticated
USING (true);

-- ============================================
-- 4. CRIAR POLICIES PARA CONVERSATIONS
-- ============================================

CREATE POLICY "Allow all for anon and authenticated users"
ON conversations
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. CRIAR POLICIES PARA INSTANCES
-- ============================================

CREATE POLICY "Allow all for anon and authenticated users"
ON instances
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. CRIAR POLICIES PARA AI_AGENTS
-- ============================================

CREATE POLICY "Allow all for anon and authenticated users"
ON ai_agents
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. VERIFICAR SE EXISTE TABELA USERS
-- ============================================

-- Se a tabela users existir, criar policy para ela
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- Habilitar RLS
    EXECUTE 'ALTER TABLE users ENABLE ROW LEVEL SECURITY';
    
    -- Remover policy existente
    EXECUTE 'DROP POLICY IF EXISTS "Allow read access to users" ON users';
    
    -- Criar policy de leitura
    EXECUTE 'CREATE POLICY "Allow read access to users" ON users FOR SELECT TO anon, authenticated USING (true)';
    
    RAISE NOTICE 'Policy criada para tabela users';
  ELSE
    RAISE NOTICE 'Tabela users não existe, pulando criação de policy';
  END IF;
END $$;

-- ============================================
-- 8. CONCEDER PERMISSÕES BÁSICAS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- 9. VERIFICAR POLICIES CRIADAS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
