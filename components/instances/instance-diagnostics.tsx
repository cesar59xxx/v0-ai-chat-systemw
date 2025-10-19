"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Copy, RefreshCw } from "lucide-react"

interface Instance {
  id: string
  name: string
  phone_number: string
  whatsapp_instance_id: string | null
  status: string
}

export function InstanceDiagnostics() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [whatsappId, setWhatsappId] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchInstances = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/instances")
      if (response.ok) {
        const data = await response.json()
        setInstances(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching instances:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstances()
  }, [])

  const handleSave = async (instanceId: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/instances/${instanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_instance_id: whatsappId }),
      })

      if (response.ok) {
        await fetchInstances()
        setEditingId(null)
        setWhatsappId("")
      }
    } catch (error) {
      console.error("[v0] Error saving WhatsApp ID:", error)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Para que o n8n consiga enviar mensagens, você precisa vincular o UUID do WhatsApp
          à instância. O UUID do WhatsApp é enviado pelo webhook quando você conecta a instância.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {instances.map((instance) => (
          <Card key={instance.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{instance.name}</CardTitle>
                  <CardDescription>{instance.phone_number || "Sem número"}</CardDescription>
                </div>
                <Badge variant={instance.whatsapp_instance_id ? "default" : "secondary"}>
                  {instance.whatsapp_instance_id ? "Configurado" : "Não configurado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* UUID do Supabase */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">UUID do Supabase (interno)</Label>
                <div className="flex items-center gap-2">
                  <Input value={instance.id} readOnly className="font-mono text-sm" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(instance.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* UUID do WhatsApp */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">UUID do WhatsApp (para n8n)</Label>
                {editingId === instance.id ? (
                  <div className="space-y-2">
                    <Input
                      value={whatsappId}
                      onChange={(e) => setWhatsappId(e.target.value)}
                      placeholder="Cole o UUID do WhatsApp aqui (ex: da08577c-15ef-45ce-bb8c-f251b1afb466)"
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(instance.id)} disabled={saving || !whatsappId}>
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null)
                          setWhatsappId("")
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {instance.whatsapp_instance_id ? (
                      <>
                        <Input value={instance.whatsapp_instance_id} readOnly className="font-mono text-sm" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(instance.whatsapp_instance_id!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(instance.id)
                            setWhatsappId(instance.whatsapp_instance_id || "")
                          }}
                        >
                          Editar
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => setEditingId(instance.id)}>
                        Adicionar UUID do WhatsApp
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Status */}
              {instance.whatsapp_instance_id ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Esta instância está pronta para receber mensagens do n8n usando o UUID do WhatsApp.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configure o UUID do WhatsApp para que o n8n possa enviar mensagens para esta instância.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {instances.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma instância encontrada. Crie uma instância primeiro.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
