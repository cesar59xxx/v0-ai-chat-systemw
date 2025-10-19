-- Remove trigger e função que causam erro "whatsapp_instance_id"
-- Este script limpa completamente qualquer referência ao campo whatsapp_instance_id

-- 1. Remover o trigger da tabela messages
DROP TRIGGER IF EXISTS trigger_convert_whatsapp_instance_id ON messages;

-- 2. Remover a função que usa whatsapp_instance_id
DROP FUNCTION IF EXISTS convert_whatsapp_instance_id();

-- 3. Remover a coluna whatsapp_instance_id da tabela messages (se existir)
ALTER TABLE messages DROP COLUMN IF EXISTS whatsapp_instance_id;

-- 4. Remover a coluna whatsapp_instance_id da tabela instances (se existir)
ALTER TABLE instances DROP COLUMN IF EXISTS whatsapp_instance_id;

-- 5. Verificar se há outros triggers problemáticos
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname, tgrelid::regclass AS table_name
        FROM pg_trigger
        WHERE tgname LIKE '%whatsapp%'
    LOOP
        RAISE NOTICE 'Removendo trigger: % na tabela %', trigger_record.tgname, trigger_record.table_name;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_record.tgname, trigger_record.table_name);
    END LOOP;
END $$;

-- 6. Verificar se há funções problemáticas
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname
        FROM pg_proc
        WHERE proname LIKE '%whatsapp_instance_id%'
    LOOP
        RAISE NOTICE 'Removendo função: %', func_record.proname;
        EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_record.proname);
    END LOOP;
END $$;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger e função whatsapp_instance_id removidos com sucesso!';
    RAISE NOTICE '✅ Sistema agora usa apenas instance_name para rastreamento';
END $$;
