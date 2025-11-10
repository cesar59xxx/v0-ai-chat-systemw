import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "Webhook está funcionando! Use POST para enviar mensagens.",
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    console.log("[v0] ========== WEBHOOK STARTED ==========")

    const rawBody = await request.text()
    console.log("[v0] RAW BODY:", rawBody)

    let data
    try {
      data = JSON.parse(rawBody)
      console.log("[v0] Parsed JSON:", JSON.stringify(data, null, 2))
    } catch (parseError) {
      console.error("[v0] Failed to parse JSON:", parseError)
      return NextResponse.json({ error: "Invalid JSON", receivedBody: rawBody }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Extrair dados do payload
    const instanceIdentifier = data.instance_phone_number || data.phone_number || data.instance || data.instanceName
    const contactNumber = data.Numero?.replace("@s.whatsapp.net", "") || data.Numero || data.contact_number
    const messageContent = data.Mensagem || data.message || data.content
    const directionInput = data.Direção || data.direction || "RECEIVED"
    const direction = directionInput.toUpperCase() === "SEND" ? "SEND" : "RECEIVED"
    const messageId = data.conversa_id || data.message_id
    const contactName = data.nome_contato || data.contact_name

    console.log("[v0] Extracted data:", {
      instanceIdentifier,
      contactNumber,
      messageContent,
      direction,
      messageId,
      contactName,
    })

    if (!instanceIdentifier || !contactNumber || !messageContent) {
      console.error("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Buscar instância pelo nome
    const { data: instance, error: instanceError } = await supabase
      .from("instances")
      .select("id, name, phone_number")
      .ilike("name", `%${instanceIdentifier}%`)
      .limit(1)
      .single()

    if (instanceError || !instance) {
      console.error("[v0] Instance not found:", instanceIdentifier)
      return NextResponse.json({ error: "Instance not found", identifier: instanceIdentifier }, { status: 404 })
    }

    console.log("[v0] Instance found:", instance)

    // Buscar ou criar conversa
    let { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("instance_name", instance.name)
      .eq("contact_number", contactNumber)
      .single()

    if (conversationError || !conversation) {
      console.log("[v0] Creating new conversation...")

      const conversationData = {
        instance_id: instance.id,
        instance_name: instance.name,
        instance_number: instance.phone_number,
        contact_number: contactNumber,
        contact_name: contactName || contactNumber,
        last_message: messageContent,
        last_message_at: new Date().toISOString(),
        unread_count: direction === "RECEIVED" ? 1 : 0,
      }

      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert(conversationData)
        .select("id")
        .single()

      if (createError) {
        console.error("[v0] Error creating conversation:", createError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      conversation = newConversation
      console.log("[v0] Conversation created:", conversation.id)
    } else {
      console.log("[v0] Conversation found:", conversation.id)
    }

    const messageData = {
      conversation_id: conversation.id,
      instance_name: instance.name,
      instance_number: instance.phone_number,
      content: messageContent,
      sender_type: direction === "SEND" ? "agent" : "customer",
      sender_number: contactNumber,
      contact_name: contactName,
      message_id: messageId,
      is_read: direction === "SEND",
    }

    const tableName = direction === "SEND" ? "sent_messages" : "received_messages"
    console.log("[v0] Inserting into", tableName, ":", messageData)

    const { data: message, error: messageError } = await supabase.from(tableName).insert(messageData).select().single()

    if (messageError) {
      console.error("[v0] Error saving message:", messageError)
      return NextResponse.json({ error: "Failed to save message", details: messageError }, { status: 500 })
    }

    console.log("[v0] Message saved successfully:", message.id)
    console.log("[v0] ========== WEBHOOK COMPLETED ==========")

    return NextResponse.json({
      success: true,
      message: "Message received and saved",
      data: {
        conversationId: conversation.id,
        messageId: message.id,
        table: tableName,
      },
    })
  } catch (error) {
    console.error("[v0] ========== WEBHOOK ERROR ==========")
    console.error("[v0] Webhook error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
