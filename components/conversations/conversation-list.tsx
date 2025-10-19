"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type Conversation = {
  id: string
  contact_name: string | null
  contact_number: string
  last_message: string | null
  last_message_at: string
  unread_count: number
  instance_name: string | null
}

interface ConversationListProps {
  selectedId: string | null
  filterInstanceName: string | null
  onSelectConversation: (id: string, instanceName: string | null) => void
}

export function ConversationList({ selectedId, filterInstanceName, onSelectConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [filterInstanceName])

  async function fetchConversations() {
    try {
      const url = filterInstanceName
        ? `/api/conversations?instance_name=${encodeURIComponent(filterInstanceName)}`
        : "/api/conversations"

      const response = await fetch(url)
      const data = await response.json()

      if (Array.isArray(data)) {
        setConversations(data)
        if (data.length > 0 && !selectedId) {
          const firstConv = data[0]
          onSelectConversation(firstConv.id, firstConv.instance_name)
        }
      } else {
        setConversations([])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.contact_number.includes(search) ||
      conv.last_message?.toLowerCase().includes(search.toLowerCase()),
  )

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return "Agora"
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  if (loading) {
    return (
      <div className="w-96 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="h-8 bg-muted rounded-lg animate-pulse mb-4" />
          <div className="h-10 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4">Conversas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhuma conversa</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {filterInstanceName
                ? "Nenhuma conversa encontrada para esta instância"
                : "As conversas aparecerão aqui quando você receber mensagens"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id, conversation.instance_name)}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all duration-200 mb-1 group",
                  selectedId === conversation.id ? "bg-primary/10 shadow-sm" : "hover:bg-muted/50 active:scale-[0.98]",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {(conversation.contact_name || conversation.contact_number).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-semibold truncate text-foreground">
                        {conversation.contact_name || conversation.contact_number}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate leading-relaxed">
                        {conversation.last_message}
                      </p>
                    )}
                    {conversation.instance_name && (
                      <p className="text-xs text-muted-foreground/70 mt-1">via {conversation.instance_name}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
