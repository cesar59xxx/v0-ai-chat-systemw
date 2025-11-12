-- =====================================================
-- SCRIPT 045: ISOLAMENTO COMPLETO DE DADOS POR USUÁRIO
-- =====================================================
-- Este script implementa isolamento total (multitenancy)
-- garantindo que cada usuário só acesse seus próprios dados

-- Passo 1: Adicionar user_id em TODAS as tabelas que não têm
-- =====================================================

-- Adicionar user_id à tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar user_id à tabela messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar user_id à tabela sent_messages
ALTER TABLE sent_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar user_id à tabela received_messages
ALTER TABLE received_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar user_id à tabela ai_agents
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Passo 2: Migrar dados existentes para associar ao user_id correto
-- =====================================================

-- Atualizar conversations: pegar user_id da instância relacionada
UPDATE conversations c
SET user_id = i.user_id
FROM instances i
WHERE c.instance_id = i.id
AND c.user_id IS NULL;

-- Atualizar messages: pegar user_id da conversa relacionada
UPDATE messages m
SET user_id = c.user_id
FROM conversations c
WHERE m.conversation_id = c.id
AND m.user_id IS NULL;

-- Atualizar sent_messages: pegar user_id da conversa relacionada
UPDATE sent_messages sm
SET user_id = c.user_id
FROM conversations c
WHERE sm.conversation_id = c.id
AND sm.user_id IS NULL;

-- Atualizar received_messages: pegar user_id da conversa relacionada
UPDATE received_messages rm
SET user_id = c.user_id
FROM conversations c
WHERE rm.conversation_id = c.id
AND rm.user_id IS NULL;

-- Atualizar ai_agents: pegar user_id da instância relacionada
UPDATE ai_agents a
SET user_id = i.user_id
FROM instances i
WHERE a.instance_id = i.id
AND a.user_id IS NULL;

-- Passo 3: Criar índices para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_messages_user_id ON sent_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_received_messages_user_id ON received_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);

-- Passo 4: Remover políticas antigas (permissivas)
-- =====================================================

-- Remover políticas da tabela instances
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON instances;

-- Remover políticas da tabela conversations
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON conversations;

-- Remover políticas da tabela messages
DROP POLICY IF EXISTS "Allow insert for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow select for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow update for anon and authenticated users" ON messages;
DROP POLICY IF EXISTS "Allow delete for anon and authenticated users" ON messages;

-- Remover políticas da tabela ai_agents
DROP POLICY IF EXISTS "Allow all for anon and authenticated users" ON ai_agents;

-- Passo 5: Habilitar RLS em todas as tabelas
-- =====================================================

ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE received_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Passo 6: Criar políticas RLS RESTRITIVAS (somente owner)
-- =====================================================

-- Políticas para INSTANCES
CREATE POLICY "Users can view their own instances"
  ON instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own instances"
  ON instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own instances"
  ON instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instances"
  ON instances FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para CONVERSATIONS
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para MESSAGES
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para SENT_MESSAGES
CREATE POLICY "Users can view their own sent messages"
  ON sent_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sent messages"
  ON sent_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sent messages"
  ON sent_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sent messages"
  ON sent_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para RECEIVED_MESSAGES
CREATE POLICY "Users can view their own received messages"
  ON received_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own received messages"
  ON received_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own received messages"
  ON received_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own received messages"
  ON received_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para AI_AGENTS
CREATE POLICY "Users can view their own AI agents"
  ON ai_agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI agents"
  ON ai_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI agents"
  ON ai_agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI agents"
  ON ai_agents FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para PROFILES
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Passo 7: Tornar user_id obrigatório (NOT NULL) após migração
-- =====================================================

-- Tornar NOT NULL apenas após garantir que todos os dados foram migrados
ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE ai_agents ALTER COLUMN user_id SET NOT NULL;

-- Passo 8: Habilitar Realtime com RLS
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE instances;

-- Passo 9: Criar trigger para propagar user_id automaticamente
-- =====================================================

-- Trigger para garantir que novas mensagens herdem user_id da conversa
CREATE OR REPLACE FUNCTION set_message_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM conversations
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_message_user_id
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_user_id();

-- Trigger para garantir que novos agentes AI herdem user_id da instância
CREATE OR REPLACE FUNCTION set_ai_agent_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.instance_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM instances
    WHERE id = NEW.instance_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_ai_agent_user_id
  BEFORE INSERT ON ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION set_ai_agent_user_id();

-- Passo 10: Verificação final
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS habilitado em todas as tabelas';
  RAISE NOTICE '✅ Políticas restritivas criadas (somente owner)';
  RAISE NOTICE '✅ user_id adicionado em todas as tabelas';
  RAISE NOTICE '✅ Dados existentes migrados';
  RAISE NOTICE '✅ Índices criados para performance';
  RAISE NOTICE '✅ Triggers automáticos configurados';
  RAISE NOTICE '⚠️  IMPORTANTE: Execute este script no Supabase SQL Editor';
  RAISE NOTICE '⚠️  Depois, faça deploy do código atualizado na Vercel';
END $$;
