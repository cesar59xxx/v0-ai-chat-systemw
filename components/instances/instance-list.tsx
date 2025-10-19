"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, QrCode, Trash2, Sparkles, AlertTriangle } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Instance = {
  id: string
  name: string
  phone_number: string | null
  status: "disconnected" | "connecting" | "connected"
  created_at: string
  whatsapp_instance_id: string | null
}

export function InstanceList() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null)

  useEffect(() => {
    fetchInstances()
  }, [])

  async function fetchInstances() {
    try {
      const response = await fetch("/api/instances")
      const data = await response.json()
      setInstances(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error fetching instances:", error)
      setInstances([])
    } finally {
      setLoading(false)
    }
  }

  async function deleteInstance(id: string) {
    setDeleting(id)
    try {
      const response = await fetch(`/api/instances/${id}`, { method: "DELETE" })

      if (!response.ok) {
        throw new Error("Erro ao excluir instância")
      }

      fetchInstances()
      setInstanceToDelete(null)
    } catch (error) {
      console.error("[v0] Error deleting instance:", error)
      alert("Erro ao excluir instância. Tente novamente.")
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse bg-card border-border">
            <div className="h-6 bg-muted rounded-lg w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-6" />
            <div className="h-10 bg-muted rounded-lg" />
          </Card>
        ))}
      </div>
    )
  }

  if (instances.length === 0) {
    return (
      <Card className="p-16 text-center bg-card border-border">
        <div className="w-20 h-20 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Bot className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">Nenhuma instância criada</h3>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Crie sua primeira instância para começar a usar o sistema de atendimento com IA
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => (
          <Card
            key={instance.id}
            className="p-6 space-y-5 bg-card border-border hover:border-primary/50 transition-all duration-200 group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xl truncate group-hover:text-primary transition-colors">
                    {instance.name}
                  </h3>
                  {instance.phone_number && (
                    <p className="text-sm text-muted-foreground mt-1.5 font-mono">{instance.phone_number}</p>
                  )}
                </div>
                <Badge
                  variant={
                    instance.status === "connected"
                      ? "default"
                      : instance.status === "connecting"
                        ? "secondary"
                        : "outline"
                  }
                  className="flex-shrink-0"
                >
                  {instance.status === "connected"
                    ? "Conectado"
                    : instance.status === "connecting"
                      ? "Conectando"
                      : "Desconectado"}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={`/dashboard/instances/${instance.id}/qr`} className="flex-1">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
              </Link>
              <Link href={`/dashboard/instances/${instance.id}/ai`} className="flex-1">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full bg-transparent hover:bg-chart-3/10 hover:text-chart-3 hover:border-chart-3 transition-all"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Agente IA
                </Button>
              </Link>
            </div>

            {instance.whatsapp_instance_id && (
              <div className="pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">UUID do WhatsApp:</p>
                  <p className="font-mono text-[10px] break-all bg-muted/50 p-2 rounded">
                    {instance.whatsapp_instance_id}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInstanceToDelete(instance)}
                disabled={deleting === instance.id}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting === instance.id ? "Excluindo..." : "Excluir Instância"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!instanceToDelete} onOpenChange={(open) => !open && setInstanceToDelete(null)}>
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Excluir Instância</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base leading-relaxed pt-2">
              Tem certeza que deseja excluir a instância{" "}
              <span className="font-semibold text-foreground">{instanceToDelete?.name}</span>?
              <br />
              <br />
              Esta ação não pode ser desfeita e todos os dados relacionados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => instanceToDelete && deleteInstance(instanceToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Instância
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
