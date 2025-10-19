import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { message, instance_id, conversation_id } = await request.json()

    const { data: aiAgent, error: agentError } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("instance_id", instance_id)
      .eq("is_active", true)
      .single()

    if (agentError || !aiAgent) {
      return NextResponse.json({ error: "AI agent not configured or inactive" }, { status: 400 })
    }

    // Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("content, sender_type")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (messagesError) throw messagesError

    // Build conversation context
    const conversationHistory = (messages || [])
      .reverse()
      .map((msg: any) => `${msg.sender_type === "user" ? "Cliente" : "Assistente"}: ${msg.content}`)
      .join("\n")

    // Generate AI response
    const { text } = await generateText({
      model: aiAgent.model,
      prompt: `${aiAgent.system_prompt}

Histórico da conversa:
${conversationHistory}

Cliente: ${message}

Assistente:`,
      temperature: aiAgent.temperature,
      maxTokens: aiAgent.max_tokens,
    })

    // Save AI response to database
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id,
      instance_id,
      content: text,
      sender_type: "ai",
    })

    if (insertError) throw insertError

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("[v0] Error generating AI response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
