"use client"

import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, CheckCircle2, AlertCircle, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"

export default function SetupPage() {
  const [copied, setCopied] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [reloadSuccess, setReloadSuccess] = useState(false)

  const sqlScript = `-- Complete database setup for AI Chat System
-- Copy and paste this entire script into Supabase SQL Editor

-- Create instances table
CREATE TABLE IF NOT EXISTS instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model TEXT DEFAULT 'openai/gpt-4o-mini',
  temperature DECIMAL(2,1) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instance_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  contact_number TEXT NOT NULL,
  contact_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_number TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instances_user ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_instance ON conversations(instance_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own instances" ON instances;
DROP POLICY IF EXISTS "Users can create their own instances" ON instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON instances;
DROP POLICY IF EXISTS "Users can view ai_agents of their instances" ON ai_agents;
DROP POLICY IF EXISTS "Users can create ai_agents for their instances" ON ai_agents;
DROP POLICY IF EXISTS "Users can update ai_agents of their instances" ON ai_agents;
DROP POLICY IF EXISTS "Users can delete ai_agents of their instances" ON ai_agents;
DROP POLICY IF EXISTS "Users can view conversations of their instances" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations for their instances" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations of their instances" ON conversations;
DROP POLICY IF EXISTS "Users can delete conversations of their instances" ON conversations;
DROP POLICY IF EXISTS "Users can view messages of their instances" ON messages;
DROP POLICY IF EXISTS "Users can create messages for their instances" ON messages;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for instances
CREATE POLICY "Users can view their own instances" ON instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own instances" ON instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own instances" ON instances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own instances" ON instances FOR DELETE USING (auth.uid() = user_id);

-- Create policies for ai_agents
CREATE POLICY "Users can view ai_agents of their instances" ON ai_agents FOR SELECT USING (EXISTS (SELECT 1 FROM instances WHERE instances.id = ai_agents.instance_id AND instances.user_id = auth.uid()));
CREATE POLICY "Users can create ai_agents for their instances" ON ai_agents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM instances WHERE instances.id = ai_agents.instance_id AND instances.user_id = auth.uid()));
CREATE POLICY "Users can update ai_agents of their instances" ON ai_agents FOR UPDATE USING (EXISTS (SELECT 1 FROM instances WHERE instances.id = ai_agents.instance_id AND instances.user_id = auth.uid()));
CREATE POLICY "Users can delete ai_agents of their instances" ON ai_agents FOR DELETE USING (EXISTS (SELECT 1 FROM instances WHERE instances.id = ai_agents.instance_id AND instances.user_id = auth.uid()));

-- Create policies for conversations
CREATE POLICY "Users can view conversations of their instances" ON conversations FOR SELECT USING (EXISTS (SELECT 1 FROM instances WHERE instances.id = conversations.instance_id AND instances.user_id = auth.uid()));
CREATE POLICY "Users can create conversations for their instances" ON conversations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM instances WHERE instances.id = conversations.instance_id AND instances.user_id = auth.uid()));
CREATE POLICY "Users can update conversations of their instances" ON conversations FOR UPDATE USING (EXISTS (SELECT 1 FROM instances WHERE instances.id = conversations.instance_id AND instances.user_id = auth.uid()));
CREATE POLICY "Users can delete conversations of their instances" ON conversations FOR DELETE USING (EXISTS (SELECT 1 FROM instances WHERE instances.id = conversations.instance_id AND instances.user_id = auth.uid()));

-- Create policies for messages
CREATE POLICY "Users can view messages of their instances" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM instances WHERE instances.id = messages.instance_id AND instances.user_id = auth.uid()));
CREATE POLICY "Users can create messages for their instances" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM instances WHERE instances.id = messages.instance_id AND instances.user_id = auth.uid()));

-- Create function and trigger for auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reloadCache = async () => {
    setReloading(true)
    setReloadSuccess(false)
    try {
      await fetch("/api/instances")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setReloadSuccess(true)
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } catch (error) {
      console.error("Error reloading cache:", error)
    } finally {
      setReloading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuração do Banco de Dados</h1>
        <p className="text-muted-foreground">
          Siga o passo a passo abaixo para criar as tabelas no Supabase e começar a usar o sistema.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          As tabelas do banco de dados ainda não foram criadas. Execute o script SQL abaixo no Supabase para configurar
          o sistema.
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm font-semibold text-primary">1</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Acesse o Supabase Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-3">Abra o dashboard do Supabase em uma nova aba:</p>
            <a
              href="https://supabase.com/dashboard/project/_/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir SQL Editor do Supabase
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm font-semibold text-primary">2</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Copie o Script SQL</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Clique no botão abaixo para copiar o script SQL completo:
            </p>
            <Button onClick={copyToClipboard} variant="outline" className="mb-4 bg-transparent">
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copiado!" : "Copiar Script SQL"}
            </Button>
            <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{sqlScript}</pre>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm font-semibold text-primary">3</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Cole e Execute no Supabase</h3>
            <p className="text-sm text-muted-foreground mb-3">No SQL Editor do Supabase:</p>
            <ol className="text-sm text-muted-foreground space-y-2 ml-4 list-decimal">
              <li>Cole o script SQL copiado no editor</li>
              <li>Clique no botão "Run" (ou pressione Ctrl+Enter)</li>
              <li>Aguarde a execução completar (deve levar alguns segundos)</li>
              <li>Verifique se não há erros na saída</li>
            </ol>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm font-semibold text-primary">4</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Recarregue o Cache do Supabase</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Após executar o script, o Supabase precisa recarregar o cache das tabelas. Clique no botão abaixo:
            </p>
            <Button onClick={reloadCache} disabled={reloading} className="mt-2">
              {reloading ? (
                <>
                  <Database className="w-4 h-4 mr-2 animate-spin" />
                  Recarregando cache...
                </>
              ) : reloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Cache recarregado! Redirecionando...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Recarregar Cache e Ir para Dashboard
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-sm font-semibold text-primary">5</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Comece a Usar</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Após recarregar o cache, você será redirecionado automaticamente para o dashboard onde poderá:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Criar instâncias WhatsApp</li>
              <li>• Configurar agentes de IA</li>
              <li>• Gerenciar conversas</li>
              <li>• Visualizar mensagens em tempo real</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />O que será criado:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Tabelas:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• instances (instâncias WhatsApp)</li>
              <li>• ai_agents (agentes de IA)</li>
              <li>• conversations (conversas)</li>
              <li>• messages (mensagens)</li>
              <li>• profiles (perfis de usuário)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Segurança:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Row Level Security (RLS)</li>
              <li>• Políticas de acesso por usuário</li>
              <li>• Índices para performance</li>
              <li>• Trigger de criação de perfil</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-amber-500/10 border-amber-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5" />
          Problemas Comuns
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2 ml-4">
          <li>
            • <strong>Erro de permissão:</strong> Certifique-se de estar logado no projeto correto do Supabase
          </li>
          <li>
            • <strong>Script não executa:</strong> Verifique se copiou o script completo (incluindo a última linha)
          </li>
          <li>
            • <strong>Tabelas não aparecem:</strong> Clique no botão "Recarregar Cache" após executar o script SQL
          </li>
          <li>
            • <strong>Erro 404 persiste:</strong> Aguarde 1-2 minutos e tente recarregar o cache novamente
          </li>
        </ul>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Link href="/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
