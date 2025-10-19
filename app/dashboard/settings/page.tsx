import { Card } from "@/components/ui/card"
import { SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie as configurações do sistema</p>
      </div>

      <Card className="p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <SettingsIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Configurações em Desenvolvimento</h3>
        <p className="text-muted-foreground">As configurações gerais do sistema estarão disponíveis em breve</p>
      </Card>
    </div>
  )
}
