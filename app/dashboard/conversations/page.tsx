"use client"

import { useState } from "react"
import { ConversationList } from "@/components/conversations/conversation-list"
import { ChatWindow } from "@/components/conversations/chat-window"
import { InstanceSelector } from "@/components/conversations/instance-selector"

export default function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [selectedInstanceName, setSelectedInstanceName] = useState<string | null>(null)
  const [filterInstanceName, setFilterInstanceName] = useState<string | null>(null)

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <InstanceSelector
          selectedInstanceName={filterInstanceName}
          onSelectInstance={(instanceName) => {
            setFilterInstanceName(instanceName)
            setSelectedConversationId(null)
            setSelectedInstanceName(null)
          }}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ConversationList
          selectedId={selectedConversationId}
          filterInstanceName={filterInstanceName}
          onSelectConversation={(id, instanceName) => {
            setSelectedConversationId(id)
            setSelectedInstanceName(instanceName)
          }}
        />
        <ChatWindow conversationId={selectedConversationId} instanceName={selectedInstanceName} />
      </div>
    </div>
  )
}
