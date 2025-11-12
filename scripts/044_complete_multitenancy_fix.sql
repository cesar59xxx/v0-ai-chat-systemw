-- ============================================
-- SCRIPT DE MULTITENANCY COMPLETO
-- Adiciona user_id em todas as tabelas e habilita RLS
-- ============================================

-- 1. ADICIONAR user_id em todas as tabelas que não têm
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. POPULAR user_id nas tabelas usando o user_id da instância relacionada
UPDATE conversations 
SET user_id = instances.user_id 
FROM instances 
WHERE conversations.instance_id = instances.id 
AND conversations.user_id IS NULL;

UPDATE messages 
SET user_id = instances.user_id 
FROM instances 
WHERE messages.instance_id = instances.id 
AND messages.user_id IS NULL;

UPDATE ai_agents 
SET user_id = instances.user_id 
FROM instances 
WHERE ai_agents.instance_id = instances.id 
AND ai_agents.user_id IS NULL;

-- 3. TORNAR user_id NOT NULL (após popular os dados)
ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE ai_agents ALTER COLUMN user_id SET NOT NULL;

-- 4. CRIAR ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);

-- 5. REMOVER POLÍTICAS ANTIGAS (permissivas)
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON instances;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON conversations;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON ai_agents;

DROP POLICY IF EXISTS "Allow insert for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow select for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow delete for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow update for anon and authenticated users" ON messages;

-- 6. HABILITAR RLS em todas as tabelas
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS CORRETAS (isolamento por user_id)

-- INSTANCES: Usuário só vê/edita suas próprias instâncias
CREATE POLICY "Users can view their own instances"
ON instances FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own instances"
ON instances FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instances"
ON instances FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instances"
ON instances FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- CONVERSATIONS: Usuário só vê suas próprias conversas
CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON conversations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- MESSAGES: Usuário só vê suas próprias mensagens
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- AI_AGENTS: Usuário só vê/edita seus próprios agentes
CREATE POLICY "Users can view their own ai_agents"
ON ai_agents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai_agents"
ON ai_agents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai_agents"
ON ai_agents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai_agents"
ON ai_agents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- PROFILES: Usuário só vê seu próprio perfil
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 8. POLÍTICAS PARA SERVICE ROLE (webhook precisa inserir sem autenticação)
CREATE POLICY "Service role can insert conversations"
ON conversations FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can insert messages"
ON messages FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update conversations"
ON conversations FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 9. HABILITAR REALTIME apenas para usuário autenticado
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 10. FUNÇÃO PARA AUTO-PREENCHER user_id ao inserir
CREATE OR REPLACE FUNCTION auto_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se user_id não foi fornecido, pega do auth.uid()
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em todas as tabelas relevantes
DROP TRIGGER IF EXISTS auto_set_user_id_trigger ON instances;
CREATE TRIGGER auto_set_user_id_trigger
BEFORE INSERT ON instances
FOR EACH ROW
EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS auto_set_user_id_trigger ON conversations;
CREATE TRIGGER auto_set_user_id_trigger
BEFORE INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS auto_set_user_id_trigger ON messages;
CREATE TRIGGER auto_set_user_id_trigger
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION auto_set_user_id();

DROP TRIGGER IF EXISTS auto_set_user_id_trigger ON ai_agents;
CREATE TRIGGER auto_set_user_id_trigger
BEFORE INSERT ON ai_agents
FOR EACH ROW
EXECUTE FUNCTION auto_set_user_id();

-- CONCLUÍDO
SELECT 'Multitenancy configurado com sucesso! Todas as tabelas agora têm RLS habilitado e user_id obrigatório.' AS status;
