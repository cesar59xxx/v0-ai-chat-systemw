"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageSquare, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"

type Conversation = {
  id: string
  contact_name: string
  contact_number: string
  last_message: string
  last_message_at: string
  instance_name: string
  instance_id: string
  instance_number: string
}

type Message = {
  id: string
  content: string
  sender_type: string
  direction?: string
  sender_number: string | null
  contact_name?: string | null
  created_at: string
}

interface ChatWindowProps {
  conversationId: string | null
  phoneNumber: string | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (res.status === 429) {
    throw new Error("Too many requests. Please wait a moment.")
  }

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  return res.json()
}

export function ChatWindow({ conversationId, phoneNumber }: ChatWindowProps) {
  const { data: conversation, error: conversationError } = useSWR<Conversation>(
    conversationId ? `/api/conversations/${conversationId}` : null,
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    },
  )

  const {
    data: messages = [],
    error: messagesError,
    mutate: mutateMessages,
  } = useSWR<Message[]>(conversationId ? `/api/conversations/${conversationId}/messages` : null, fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveInstanceName = conversation?.instance_name?.trim()
  const effectivePhoneNumber = phoneNumber || conversation?.instance_number
  const effectiveInstanceId = conversation?.instance_id

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    console.log("[v0] Frontend - Messages received:", messages?.length || 0)
    console.log("[v0] Frontend - Messages data:", messages)
    messages?.forEach((msg, index) => {
      console.log(`[v0] Frontend - Message ${index + 1}:`, {
        id: msg.id,
        content: msg.content,
        direction: msg.direction,
        sender_type: msg.sender_type,
      })
    })
  }, [messages])

  async function sendMessage() {
    if (!newMessage.trim() || !conversationId) {
      return
    }

    if (!effectiveInstanceName) {
      console.error("Cannot send message: missing instance_name", {
        conversationLoaded: !!conversation,
        instanceName: conversation?.instance_name,
      })
      return
    }

    setSending(true)
    const messageContent = newMessage
    setNewMessage("")

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_type: "agent",
      direction: "sent",
      sender_number: conversation?.contact_number || null,
      contact_name: conversation?.contact_name || null,
      created_at: new Date().toISOString(),
    }

    mutateMessages([...messages, optimisticMessage], false)

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          sender_type: "agent",
          direction: "sent",
          instance_name: effectiveInstanceName,
          instance_id: effectiveInstanceId,
          instance_number: effectivePhoneNumber,
        }),
      })

      if (response.ok) {
        mutateMessages()
        inputRef.current?.focus()
      } else {
        const error = await response.text()
        console.error("Error sending message:", error)
        mutateMessages(messages, false)
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      mutateMessages(messages, false)
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else if (diffInHours < 48) {
      return "Ontem"
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Bem-vindo ao Chat</h3>
            <p className="text-muted-foreground leading-relaxed">
              Selecione uma conversa da lista ao lado para começar a visualizar e responder mensagens
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (conversationError || messagesError) {
    const errorMessage = conversationError?.message || messagesError?.message
    if (errorMessage?.includes("Too many requests")) {
      return (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-md px-4">
            <p className="text-muted-foreground">Muitas requisições. Aguarde um momento...</p>
          </div>
        </div>
      )
    }
  }

  const allMessages: Message[] = []

  // Agora as mensagens vêm APENAS da API de mensagens, evitando duplicação e exibição incorreta
  allMessages.push(...messages)

  console.log("[v0] Frontend - Messages to display:", allMessages.length)

  const isLoading = !conversation && !conversationError
  const canSend = effectiveInstanceName

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {conversation?.contact_name?.charAt(0).toUpperCase() || "C"}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{conversation?.contact_name || "Carregando..."}</h3>
            <p className="text-xs text-muted-foreground">{conversation?.contact_number || ""}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          allMessages.map((message) => {
            const isSent =
              message.direction === "SEND" ||
              message.direction === "sent" ||
              message.sender_type === "agent" ||
              message.sender_type === "user"

            console.log("[v0] Frontend - Rendering message:", {
              id: message.id,
              content: message.content,
              isSent,
              direction: message.direction,
              sender_type: message.sender_type,
            })

            return (
              <div key={message.id} className={cn("flex gap-2 items-end", isSent ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                    isSent ? "bg-[#25D366] text-white rounded-br-sm" : "bg-card border border-border rounded-bl-sm",
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={cn("text-xs mt-1 text-right", isSent ? "text-white/70" : "text-muted-foreground")}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            placeholder="Digite uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending || !canSend}
            className="flex-1 rounded-full bg-background/50 border-border/50 focus:border-primary transition-colors"
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim() || !canSend}
            size="icon"
            className="rounded-full w-11 h-11 bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
        {!canSend && conversationId && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {isLoading ? "Carregando informações da conversa..." : "Aguardando conexão da instância..."}
          </p>
        )}
      </div>
    </div>
  )
}
