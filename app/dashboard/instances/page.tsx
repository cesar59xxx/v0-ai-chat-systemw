import { InstanceList } from "@/components/instances/instance-list"
import { CreateInstanceButton } from "@/components/instances/create-instance-button"
import { createClient } from "@/lib/supabase/server"

export default async function InstancesPage() {
  const supabase = await createClient()
  const { data: instances } = await supabase.from("instances").select("id")
  const instanceCount = instances?.length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Instâncias</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Gerencie suas conexões WhatsApp e configure agentes de IA para atendimento automático
            </p>
          </div>
          <CreateInstanceButton currentCount={instanceCount} />
        </div>

        <InstanceList />
      </div>
    </div>
  )
}
