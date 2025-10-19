"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Loader2, Copy, Check, Sparkles } from "lucide-react"

export default function WebhookTestPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [instanceName, setInstanceName] = useState("vucovuco")
  const [contactNumber, setContactNumber] = useState("556284950094")
  const [message, setMessage] = useState("Teste de mensagem")
  const [contactName, setContactName] = useState("Cesar")
  const [copied, setCopied] = useState<string | null>(null)

  const supabaseUrl = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL : ""
  const supabaseKey = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : ""

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const testWebhook = async () => {
    setTesting(true)
    setResult(null)

    try {
      const webhookUrl = `${supabaseUrl}/rest/v1/messages`

      const payload = {
        instance_name: instanceName,
        content: message,
        sender_type: "customer",
        sender_number: `${contactNumber}@s.whatsapp.net`,
        direction: "received",
        message_id: `msg_${Date.now()}`,
        contact_name: contactName,
        is_read: false,
      }

      console.log("[v0] Sending to Supabase:", webhookUrl)
      console.log("[v0] Payload:", payload)

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      setResult({
        success: response.ok,
        status: response.status,
        data: data,
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuração do n8n - SOLUÇÃO DEFINITIVA</h1>
        <p className="text-muted-foreground mt-2">
          Execute o script SQL e configure o n8n em 2 minutos. Sem complicação!
        </p>
      </div>

      <Card className="border-blue-500 bg-blue-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5" />
            PASSO 1: Execute o Script SQL
          </CardTitle>
          <CardDescription>
            Execute este script UMA VEZ no Supabase para configurar tudo automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <p className="font-semibold mb-2">📋 O que o script faz:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Torna os campos instance_id e conversation_id opcionais</li>
              <li>Cria um trigger que preenche automaticamente esses campos</li>
              <li>Busca ou cria a instância pelo nome automaticamente</li>
              <li>Busca ou cria a conversa automaticamente</li>
              <li>Desabilita RLS para permitir inserções diretas do n8n</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => window.open(`${supabaseUrl.replace("/rest/v1", "")}/project/default/sql/new`, "_blank")}
            >
              Abrir SQL Editor do Supabase
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard("016_final_fix_auto_populate.sql", "script-name")}>
              {copied === "script-name" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Copiar Nome do Script
            </Button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-sm font-semibold mb-1">⚠️ Importante:</p>
            <p className="text-xs">
              Você precisa executar o script{" "}
              <code className="bg-muted px-1 py-0.5 rounded">016_final_fix_auto_populate.sql</code> no SQL Editor do
              Supabase ANTES de configurar o n8n. Clique no botão "Executar Script" na interface do v0.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-500 bg-green-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Sparkles className="h-5 w-5" />
            PASSO 2: Configure o n8n
          </CardTitle>
          <CardDescription>Agora você só precisa enviar o NOME da instância. Tudo é automático!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <p className="font-semibold mb-2">🎉 Como funciona agora:</p>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>
                Execute o script SQL{" "}
                <code className="bg-muted px-1 py-0.5 rounded">014_simplify_use_instance_name.sql</code>
              </li>
              <li>
                Envie o NOME da instância no campo <code className="bg-muted px-1 py-0.5 rounded">instance_name</code>
              </li>
              <li>O trigger busca/cria a instância automaticamente</li>
              <li>O trigger cria/atualiza a conversa automaticamente</li>
              <li>✅ Tudo funciona automaticamente!</li>
            </ol>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <p className="font-semibold mb-2">🚀 Vantagens:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>❌ Não precisa mais de UUID do WhatsApp</li>
              <li>❌ Não precisa vincular manualmente</li>
              <li>❌ Não precisa de múltiplos nós no n8n</li>
              <li>✅ Apenas 1 HTTP Request</li>
              <li>✅ Usa o nome da instância que você já conhece</li>
              <li>✅ Se a instância não existir, cria automaticamente</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">📝 Configuração do n8n (HTTP Request):</p>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">Método e URL:</p>
                <div className="bg-muted p-3 rounded-lg space-y-1 text-sm font-mono">
                  <div>
                    Método: <span className="text-yellow-600">POST</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="flex-1">{supabaseUrl}/rest/v1/messages</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`${supabaseUrl}/rest/v1/messages`, "url")}
                    >
                      {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium mb-1">Headers:</p>
                <div className="bg-muted p-3 rounded-lg space-y-1 text-xs font-mono">
                  <div>apikey: {supabaseKey?.substring(0, 30)}...</div>
                  <div>Authorization: Bearer {supabaseKey?.substring(0, 30)}...</div>
                  <div>Content-Type: application/json</div>
                  <div>Prefer: return=representation</div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium mb-1">Body (JSON) - SUPER SIMPLES:</p>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto">
                    {`{
  "instance_name": "{{ $json.body.instance }}",
  "content": "{{ $json.body.data.message.conversation }}",
  "sender_type": "{{ $json.body.data.key.fromMe ? 'agent' : 'customer' }}",
  "sender_number": "{{ $json.body.data.key.remoteJid }}",
  "direction": "{{ $json.body.data.key.fromMe ? 'sent' : 'received' }}",
  "message_id": "{{ $json.body.data.key.id }}",
  "contact_name": "{{ $json.body.data.pushName }}",
  "is_read": false
}`}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() =>
                      copyToClipboard(
                        `{
  "instance_name": "{{ $json.body.instance }}",
  "content": "{{ $json.body.data.message.conversation }}",
  "sender_type": "{{ $json.body.data.key.fromMe ? 'agent' : 'customer' }}",
  "sender_number": "{{ $json.body.data.key.remoteJid }}",
  "direction": "{{ $json.body.data.key.fromMe ? 'sent' : 'received' }}",
  "message_id": "{{ $json.body.data.key.id }}",
  "contact_name": "{{ $json.body.data.pushName }}",
  "is_read": false
}`,
                        "body",
                      )
                    }
                  >
                    {copied === "body" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-sm font-semibold mb-1">💡 Nota Importante:</p>
            <p className="text-xs">
              O campo <code className="bg-muted px-1 py-0.5 rounded">instance_name</code> pode ser o nome que você deu à
              instância (ex: "vucovuco") OU o UUID que o WhatsApp envia. O trigger detecta automaticamente e busca a
              instância correta!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Testar Inserção</CardTitle>
          <CardDescription>Simular o envio do n8n para o Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instance">Nome da Instância</Label>
            <Input
              id="instance"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="vucovuco"
            />
            <p className="text-xs text-muted-foreground">
              Digite o nome da sua instância. Se não existir, será criada automaticamente!
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Número do Contato</Label>
            <Input
              id="contact"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="556284950094"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Nome do Contato</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Cesar"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ainda nao"
              rows={3}
            />
          </div>

          <Button onClick={testWebhook} disabled={testing || !instanceName}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              "Testar Inserção"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Sucesso
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Erro
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
