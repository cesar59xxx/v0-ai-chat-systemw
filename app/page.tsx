import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bot, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">AI Chat System</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary">
            <Zap className="w-4 h-4" />
            <span>Sistema de Atendimento Inteligente</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance">
            Atendimento automatizado com <span className="text-primary">Inteligência Artificial</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Conecte múltiplas instâncias do WhatsApp e configure agentes de IA personalizados para cada uma. Atendimento
            24/7 com respostas inteligentes e contextualizadas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-base">
                Começar Agora
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 bg-card border border-border rounded-lg space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Chat ao Vivo</h3>
              <p className="text-muted-foreground text-sm">
                Interface completa para gerenciar conversas em tempo real com seus clientes
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg space-y-3">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold">Agentes de IA</h3>
              <p className="text-muted-foreground text-sm">
                Configure prompts personalizados para cada instância e deixe a IA responder automaticamente
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg space-y-3">
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-chart-4" />
              </div>
              <h3 className="text-lg font-semibold">Múltiplas Instâncias</h3>
              <p className="text-muted-foreground text-sm">
                Gerencie várias contas do WhatsApp simultaneamente, cada uma com seu próprio agente
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI Chat System - Atendimento Inteligente Automatizado</p>
        </div>
      </footer>
    </div>
  )
}
