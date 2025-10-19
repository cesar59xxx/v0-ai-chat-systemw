import { InstanceDiagnostics } from "@/components/instances/instance-diagnostics"

export default function InstanceDiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diagnóstico de Instâncias</h1>
        <p className="text-muted-foreground mt-2">Verifique e configure os UUIDs do WhatsApp para suas instâncias</p>
      </div>

      <InstanceDiagnostics />
    </div>
  )
}
