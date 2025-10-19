import { QRCodeDisplay } from "@/components/instances/qr-code-display"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function QRCodePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: instance, error } = await supabase.from("instances").select("*").eq("id", id).single()

  if (error || !instance) {
    notFound()
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/instances">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Conectar WhatsApp</h1>
          <p className="text-muted-foreground mt-2">{instance.name}</p>
        </div>
        <Badge
          variant={
            instance.status === "connected" ? "default" : instance.status === "connecting" ? "secondary" : "outline"
          }
        >
          {instance.status === "connected"
            ? "Conectado"
            : instance.status === "connecting"
              ? "Conectando"
              : "Desconectado"}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">QR Code</h2>
          <QRCodeDisplay instanceId={id} />
        </Card>

        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-6">Como conectar</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Abra o WhatsApp no seu celular</h3>
                <p className="text-sm text-muted-foreground">
                  Certifique-se de que você tem a versão mais recente do aplicativo
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Acesse as configurações</h3>
                <p className="text-sm text-muted-foreground">
                  Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Selecione Aparelhos conectados</h3>
                <p className="text-sm text-muted-foreground">Toque em "Conectar um aparelho"</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold text-sm">4</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Escaneie o QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Aponte seu celular para esta tela para escanear o código
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg mt-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Importante:</strong> Mantenha seu celular conectado à internet
                durante o processo de conexão. O QR Code expira após alguns minutos.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
