"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, LinkIcon } from "lucide-react"
import Link from "next/link"

export default function WhatsAppIdPage() {
  const params = useParams()
  const router = useRouter()
  const [instance, setInstance] = useState<any>(null)
  const [whatsappId, setWhatsappId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchInstance()
  }, [])

  async function fetchInstance() {
    try {
      const response = await fetch(`/api/instances/${params.id}`)
      const data = await response.json()
      setInstance(data)
      setWhatsappId(data.whatsapp_instance_id || "")
    } catch (error) {
      console.error("[v0] Error fetching instance:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveWhatsAppId() {
    setSaving(true)
    try {
      const response = await fetch(`/api/instances/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_instance_id: whatsappId }),
      })

      if (!response.ok) throw new Error("Erro ao salvar")

      alert("UUID do WhatsApp vinculado com sucesso!")
      router.push("/dashboard/instances")
    } catch (error) {
      console.error("[v0] Error saving WhatsApp ID:", error)
      alert("Erro ao salvar UUID do WhatsApp")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded-lg w-48 animate-pulse" />
        <Card className="p-8 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-6" />
          <div className="h-10 bg-muted rounded mb-4" />
          <div className="h-10 bg-muted rounded w-32" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/instances">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Vincular UUID do WhatsApp</h1>
          <p className="text-muted-foreground mt-1">
            Instância: <span className="font-semibold">{instance?.name}</span>
          </p>
        </div>
      </div>

      <Card className="p-8 max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <LinkIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-500">Por que preciso vincular o UUID?</p>
              <p className="text-muted-foreground leading-relaxed">
                O WhatsApp envia um UUID único para cada instância (ex: da08577c-15ef-45ce-bb8c-f251b1afb466). Você
                precisa vincular esse UUID à sua instância para que o n8n possa enviar mensagens corretamente.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="whatsapp-id" className="text-base font-medium">
              UUID da Instância do WhatsApp
            </Label>
            <Input
              id="whatsapp-id"
              value={whatsappId}
              onChange={(e) => setWhatsappId(e.target.value)}
              placeholder="da08577c-15ef-45ce-bb8c-f251b1afb466"
              className="h-11 font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Cole aqui o UUID que o WhatsApp enviou para o n8n no campo "instance"
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={saveWhatsAppId} disabled={saving || !whatsappId.trim()} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar UUID"}
            </Button>
            <Link href="/dashboard/instances">
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-6 max-w-2xl bg-muted/30">
        <h3 className="font-semibold mb-3">Como encontrar o UUID do WhatsApp?</h3>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>No n8n, quando o webhook recebe uma mensagem do WhatsApp</li>
          <li>Procure pelo campo "instance" no JSON recebido</li>
          <li>Copie o valor (será algo como: da08577c-15ef-45ce-bb8c-f251b1afb466)</li>
          <li>Cole aqui neste campo e salve</li>
        </ol>
      </Card>
    </div>
  )
}
