import { AIAgentConfig } from "@/components/instances/ai-agent-config"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function AIAgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: instance, error: instanceError } = await supabase.from("instances").select("*").eq("id", id).single()

  if (instanceError || !instance) {
    notFound()
  }

  const { data: aiAgent } = await supabase.from("ai_agents").select("*").eq("instance_id", id).single()

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
          <h1 className="text-3xl font-bold tracking-tight">Configurar Agente de IA</h1>
          <p className="text-muted-foreground mt-2">{instance.name}</p>
        </div>
      </div>

      <AIAgentConfig instanceId={id} aiAgent={aiAgent} />
    </div>
  )
}
