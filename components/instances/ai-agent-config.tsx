"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Bot, Save, Sparkles, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AIAgent = {
  id: string
  instance_id: string
  name: string
  system_prompt: string
  model: string
  temperature: number
  max_tokens: number
  is_active: boolean
}

type Props = {
  instanceId: string
  aiAgent: AIAgent | null
}

export function AIAgentConfig({ instanceId, aiAgent }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    name: aiAgent?.name || "Assistente Virtual",
    system_prompt:
      aiAgent?.system_prompt ||
      "Você é um assistente virtual prestativo e profissional. Responda de forma clara, objetiva e amigável. Sempre mantenha um tom cordial e ajude o cliente da melhor forma possível.",
    is_active: aiAgent?.is_active ?? true,
  })

  async function handleSave() {
    setLoading(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/instances/${instanceId}/ai-agent`, {
        method: aiAgent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          model: "openai/gpt-4o-mini", // Modelo fixo
          temperature: 0.7, // Temperatura padrão
          max_tokens: 1000, // Tokens padrão
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error saving AI agent:", error)
    } finally {
      setLoading(false)
    }
  }

  const promptExamples = [
    {
      title: "Atendimento ao Cliente",
      description: "Ideal para suporte e dúvidas",
      prompt:
        "Você é um assistente de atendimento ao cliente profissional e empático. Responda sempre de forma cordial, clara e objetiva. Priorize resolver os problemas dos clientes de forma eficiente. Se não souber a resposta, seja honesto e ofereça alternativas.",
    },
    {
      title: "Vendas e Conversão",
      description: "Focado em vendas consultivas",
      prompt:
        "Você é um assistente de vendas especializado. Seu objetivo é ajudar os clientes a encontrar os produtos ideais para suas necessidades. Seja consultivo, faça perguntas relevantes e destaque os benefícios dos produtos. Mantenha um tom amigável e profissional.",
    },
    {
      title: "Suporte Técnico",
      description: "Para resolver problemas técnicos",
      prompt:
        "Você é um especialista em suporte técnico. Ajude os usuários a resolver problemas de forma clara e passo a passo. Use linguagem simples e evite jargões técnicos desnecessários. Seja paciente e peça informações adicionais quando necessário.",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Configurar Agente de IA</h2>
          <p className="text-muted-foreground mt-1">
            Personalize como seu assistente virtual irá responder aos clientes
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Este agente usa o modelo <strong>GPT-4o Mini</strong> da OpenAI, otimizado para respostas rápidas e precisas.
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">
              Nome do Agente
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Assistente de Vendas"
              className="h-11"
            />
            <p className="text-sm text-muted-foreground">Como você quer chamar este assistente</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-medium">
              Instruções para o Agente
            </Label>
            <Textarea
              id="prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="Descreva como o agente deve se comportar..."
              rows={10}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Explique detalhadamente como o agente deve se comportar, que tom usar e como responder aos clientes
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="is_active" className="cursor-pointer text-base font-medium">
                Respostas Automáticas
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Quando ativo, o agente responderá automaticamente às mensagens
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={loading} className="flex-1 h-11">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : saved ? "Salvo com sucesso!" : "Salvar Configurações"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Modelos de Instruções</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Clique em um modelo para usar como base e personalize conforme necessário
        </p>
        <div className="grid gap-3">
          {promptExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setFormData({ ...formData, system_prompt: example.prompt })}
              className="w-full p-4 text-left bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-primary/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{example.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{example.description}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{example.prompt}</p>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  Usar
                </Button>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Dicas para criar boas instruções
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-primary font-bold">1.</span>
            <p>Seja específico sobre o tom: formal, amigável, técnico, etc.</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold">2.</span>
            <p>Defina limites claros sobre o que o agente pode ou não fazer</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold">3.</span>
            <p>Inclua exemplos de como responder em situações específicas</p>
          </div>
          <div className="flex gap-2">
            <span className="text-primary font-bold">4.</span>
            <p>Teste as respostas e ajuste as instruções conforme necessário</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
