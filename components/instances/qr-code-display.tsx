"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle2, Loader2 } from "lucide-react"
import Image from "next/image"

type Props = {
  instanceId: string
}

export function QRCodeDisplay({ instanceId }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQRCode()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [instanceId])

  async function fetchQRCode() {
    setLoading(true)
    try {
      const response = await fetch(`/api/instances/${instanceId}/qr`)
      const data = await response.json()
      setQrCode(data.qr_code)
      setStatus(data.status)
    } catch (error) {
      console.error("[v0] Error fetching QR code:", error)
    } finally {
      setLoading(false)
    }
  }

  async function checkStatus() {
    try {
      const response = await fetch(`/api/instances/${instanceId}/status`)
      const data = await response.json()
      setStatus(data.status)
    } catch (error) {
      console.error("[v0] Error checking status:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === "connected") {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Conectado com sucesso!</h3>
          <p className="text-sm text-muted-foreground mt-2">Sua instância está pronta para receber mensagens</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center bg-white p-8 rounded-lg">
        {qrCode ? (
          <div className="relative w-64 h-64">
            <Image
              src={qrCode || "/placeholder.svg"}
              alt="QR Code do WhatsApp"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Gerando QR Code...</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "connecting" && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Aguardando conexão...</span>
            </>
          )}
          {status === "disconnected" && <span className="text-sm text-muted-foreground">Escaneie o QR Code</span>}
        </div>
        <Button variant="outline" size="sm" onClick={fetchQRCode}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  )
}
