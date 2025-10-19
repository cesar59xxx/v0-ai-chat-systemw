"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Props = {
  currentCount: number
}

export function CreateInstanceButton({ currentCount }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const MAX_INSTANCES = 3
  const canCreate = currentCount < MAX_INSTANCES

  async function handleCreate() {
    if (!name.trim()) {
      setError("Por favor, insira um nome para a instância")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone_number: phoneNumber.trim() || null }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar instância")
      }

      setOpen(false)
      setName("")
      setPhoneNumber("")

      router.push(`/dashboard/instances/${data.id}/qr`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar instância")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={!canCreate}
          size="lg"
          className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Instância
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] gap-0">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="text-2xl font-bold">Criar Nova Instância</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Configure uma nova instância do WhatsApp para começar a atender seus clientes com IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!canCreate && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-sm">
                Você atingiu o limite de {MAX_INSTANCES} instâncias do plano básico. Exclua uma instância existente para
                criar uma nova.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-sm font-semibold">
                Nome da Instância <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Atendimento Principal"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                className="h-11 text-base"
                disabled={!canCreate}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escolha um nome que identifique facilmente esta instância
              </p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Número de Telefone <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="phone"
                placeholder="Ex: +55 11 98765-4321"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-11 text-base font-mono"
                disabled={!canCreate}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                O número será preenchido automaticamente após conectar o WhatsApp
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-3 pt-6 mt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setError("")
              setName("")
              setPhoneNumber("")
            }}
            disabled={loading}
            size="lg"
            className="flex-1 sm:flex-initial"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !canCreate}
            size="lg"
            className="flex-1 sm:flex-initial min-w-[140px]"
          >
            {loading ? "Criando..." : "Criar Instância"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
