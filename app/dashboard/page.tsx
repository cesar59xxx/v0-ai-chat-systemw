import { Card } from "@/components/ui/card"
import { Bot, MessageSquare, Smartphone, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-lg text-muted-foreground">Visão geral do seu sistema de atendimento com IA</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 bg-card border-border hover:border-primary/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Instâncias Ativas</p>
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">0</p>
                <p className="text-xs text-muted-foreground mt-1">de 3 disponíveis</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-chart-2/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Conversas Hoje</p>
                <div className="w-10 h-10 bg-chart-2/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-chart-2" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">0</p>
                <p className="text-xs text-muted-foreground mt-1">nenhuma conversa ainda</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-chart-3/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Agentes IA</p>
                <div className="w-10 h-10 bg-chart-3/10 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-chart-3" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">0</p>
                <p className="text-xs text-muted-foreground mt-1">configurados</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-chart-4/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Resposta</p>
                <div className="w-10 h-10 bg-chart-4/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-chart-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">0%</p>
                <p className="text-xs text-muted-foreground mt-1">média de respostas</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 bg-card border-border">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Primeiros Passos</h2>
              <p className="text-muted-foreground mt-1">Configure seu sistema em 3 etapas simples</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-5 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Crie uma instância</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Adicione uma nova instância do WhatsApp para começar a receber mensagens dos seus clientes
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-muted/30 rounded-xl border border-border/50 hover:border-chart-2/50 transition-colors">
                <div className="w-10 h-10 bg-chart-2 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-chart-2/20">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Configure o agente de IA</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Defina o prompt e comportamento do seu assistente virtual para atender seus clientes
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 bg-muted/30 rounded-xl border border-border/50 hover:border-chart-3/50 transition-colors">
                <div className="w-10 h-10 bg-chart-3 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-chart-3/20">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Conecte via QR Code</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Escaneie o QR code com seu WhatsApp para ativar a instância e começar a atender
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
