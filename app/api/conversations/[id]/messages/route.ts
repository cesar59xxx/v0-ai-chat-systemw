import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] GET /api/conversations/[id]/messages - Starting")
    console.log("[v0] Conversation ID:", id)

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      console.error("[v0] Conversation not found or unauthorized:", convError)
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("[v0] Error fetching messages:", messagesError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    console.log("[v0] Messages found:", messages?.length || 0)

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error("[v0] Error in GET /api/conversations/[id]/messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const { content } = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] POST /api/conversations/[id]/messages - Starting")

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      console.error("[v0] Conversation not found or unauthorized:", convError)
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messageData = {
      conversation_id: id,
      instance_id: conversation.instance_id,
      user_id: user.id,
      content,
      sender_type: "agent",
      sender_number: conversation.contact_number,
      contact_name: conversation.contact_name,
      is_read: true,
    }

    console.log("[v0] Inserting message:", messageData)

    const { data: message, error: messageError } = await supabase.from("messages").insert(messageData).select().single()

    if (messageError) {
      console.error("[v0] Failed to insert message:", messageError)
      return NextResponse.json({ error: "Failed to create message", details: messageError.message }, { status: 500 })
    }

    console.log("[v0] Message inserted successfully:", message.id)

    await supabase
      .from("conversations")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

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
          sender_type: "agent",
          created_at: message.created_at,
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

    return NextResponse.json(message)
  } catch (error) {
    console.error("[v0] Error in POST /api/conversations/[id]/messages:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
