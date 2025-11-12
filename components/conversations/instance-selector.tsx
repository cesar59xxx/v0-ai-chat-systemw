"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Instance = {
  id: string
  name: string
  phone_number: string | null
  status: string
}

interface InstanceSelectorProps {
  selectedInstanceId: string | null
  onSelectInstance: (instanceId: string | null) => void
}

export function InstanceSelector({ selectedInstanceId, onSelectInstance }: InstanceSelectorProps) {
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInstances()
  }, [])

  async function fetchInstances() {
    try {
      const response = await fetch("/api/instances")
      const data = await response.json()

      if (Array.isArray(data)) {
        setInstances(data)
      }
    } catch (error) {
      console.error("Error fetching instances:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando instâncias...</span>
      </div>
    )
  }

  if (instances.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Nenhuma instância conectada</p>
        <p className="text-xs text-muted-foreground mt-1">Conecte uma instância WhatsApp para começar</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedInstanceId === null ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectInstance(null)}
          className="flex-shrink-0"
        >
          Todas as Instâncias
        </Button>
        {instances.map((instance) => (
          <Button
            key={instance.id}
            variant={selectedInstanceId === instance.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectInstance(instance.id)}
            className="flex-shrink-0 gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span className="font-medium">{instance.name}</span>
            {instance.phone_number && <span className="text-xs text-muted-foreground">({instance.phone_number})</span>}
            <span
              className={cn("w-2 h-2 rounded-full", instance.status === "connected" ? "bg-green-500" : "bg-gray-400")}
            />
          </Button>
        ))}
      </div>
    </div>
  )
}
