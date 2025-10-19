import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient()
    const { id } = params

    console.log("[v0] GET /api/conversations/[id]/messages - Starting")
    console.log("[v0] Conversation ID:", id)

    const [sentResult, receivedResult] = await Promise.all([
      supabase.from("sent_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
      supabase.from("received_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
    ])

    if (sentResult.error) {
      console.error("[v0] Error fetching sent messages:", sentResult.error)
    }

    if (receivedResult.error) {
      console.error("[v0] Error fetching received messages:", receivedResult.error)
    }

    // Mesclar e ordenar mensagens por data
    const sentMessages = (sentResult.data || []).map((msg) => ({
      ...msg,
      direction: "SEND",
      sender_type: "agent",
    }))

    const receivedMessages = (receivedResult.data || []).map((msg) => ({
      ...msg,
      direction: "RECEIVED",
      sender_type: "customer",
    }))

    const allMessages = [...sentMessages, ...receivedMessages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    console.log("[v0] Sent messages:", sentMessages.length)
    console.log("[v0] Received messages:", receivedMessages.length)
    console.log("[v0] Total messages:", allMessages.length)

    return NextResponse.json(allMessages)
  } catch (error) {
    console.error("[v0] Error in GET /api/conversations/[id]/messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient()
    const { id } = params
    const { content, sender_type, instance_name, instance_number } = await request.json()

    console.log("[v0] POST /api/conversations/[id]/messages - Starting")
    console.log("[v0] Request body:", { content, sender_type, instance_name, instance_number })

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .single()

    if (convError || !conversation) {
      console.error("[v0] Conversation not found:", convError)
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messageData = {
      conversation_id: id,
      instance_name: instance_name || conversation.instance_name,
      instance_number: instance_number || conversation.instance_number,
      content,
      sender_type: "agent",
      sender_number: conversation.contact_number,
      contact_name: conversation.contact_name,
      is_read: true,
    }

    console.log("[v0] Inserting into sent_messages:", messageData)

    const { data: message, error: messageError } = await supabase
      .from("sent_messages")
      .insert(messageData)
      .select()
      .single()

    if (messageError) {
      console.error("[v0] Failed to insert message:", messageError)
      return NextResponse.json({ error: "Failed to create message", details: messageError.message }, { status: 500 })
    }

    console.log("[v0] Message inserted successfully:", message.id)

    // Enviar para webhook
    try {
      const webhookUrl = "https://n8n-n8n.sfxb4x.easypanel.host/webhook/enviarmensagem-saas"

      const webhookPayload = {
        conversation: {
          id: conversation.id,
          contact_name: conversation.contact_name,
          contact_number: conversation.contact_number,
          instance_name: conversation.instance_name,
          instance_number: conversation.instance_number,
        },
        message: {
          id: message.id,
          content: message.content,
          direction: "SEND",
          sender_type: "agent",
          created_at: message.created_at,
          contact_name: message.contact_name,
          sender_number: message.sender_number,
        },
      }

      console.log("[v0] Sending to webhook:", webhookUrl)

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      })

      console.log("[v0] Webhook response status:", webhookResponse.status)
    } catch (webhookError) {
      console.error("[v0] Failed to send to webhook:", webhookError)
    }

    return NextResponse.json({ ...message, direction: "SEND", sender_type: "agent" })
  } catch (error) {
    console.error("[v0] Error in POST /api/conversations/[id]/messages:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
