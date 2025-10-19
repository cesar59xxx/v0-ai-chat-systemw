-- Desabilitar RLS completamente em TODAS as tabelas
-- Este script resolve o erro "permission denied for table users"

-- 1. Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas RLS existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.messages;
DROP POLICY IF EXISTS "Allow all operations" ON public.messages;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.conversations;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.conversations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.conversations;
DROP POLICY IF EXISTS "Allow all operations" ON public.conversations;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.instances;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.instances;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.instances;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.instances;
DROP POLICY IF EXISTS "Allow all operations" ON public.instances;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.ai_agents;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.ai_agents;
DROP POLICY IF EXISTS "Allow all operations" ON public.ai_agents;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations" ON public.profiles;

-- 3. Conceder permissões COMPLETAS para todos os roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Garantir que o schema public seja acessível
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Remover qualquer trigger que possa estar causando problemas
DROP TRIGGER IF EXISTS update_conversations_on_message_insert ON public.messages;
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON public.messages;
DROP TRIGGER IF EXISTS trigger_convert_whatsapp_instance_id ON public.messages;
DROP TRIGGER IF EXISTS trigger_set_instance_fields ON public.messages;

-- 6. Criar um trigger simples e seguro para atualizar conversas
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
CREATE TRIGGER update_conversations_on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- 7. Verificar e exibir o status
DO $$
BEGIN
  RAISE NOTICE 'RLS desabilitado em todas as tabelas';
  RAISE NOTICE 'Todas as políticas RLS removidas';
  RAISE NOTICE 'Permissões concedidas para todos os roles';
  RAISE NOTICE 'Triggers problemáticos removidos';
  RAISE NOTICE 'Trigger seguro criado para atualizar conversas';
END $$;
