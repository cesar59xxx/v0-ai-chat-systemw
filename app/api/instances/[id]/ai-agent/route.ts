import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: aiAgent, error } = await supabase.from("ai_agents").select("*").eq("instance_id", id).single()

    if (error) throw error

    return NextResponse.json(aiAgent)
  } catch (error) {
    console.error("[v0] Error fetching AI agent:", error)
    return NextResponse.json({ error: "Failed to fetch AI agent" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { name, system_prompt, model, temperature, max_tokens, is_active } = await request.json()

    const { data: aiAgent, error } = await supabase
      .from("ai_agents")
      .insert({
        instance_id: id,
        name,
        system_prompt,
        model,
        temperature,
        max_tokens,
        is_active,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(aiAgent)
  } catch (error) {
    console.error("[v0] Error creating AI agent:", error)
    return NextResponse.json({ error: "Failed to create AI agent" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { name, system_prompt, model, temperature, max_tokens, is_active } = await request.json()

    const { data: aiAgent, error } = await supabase
      .from("ai_agents")
      .update({
        name,
        system_prompt,
        model,
        temperature,
        max_tokens,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("instance_id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(aiAgent)
  } catch (error) {
    console.error("[v0] Error updating AI agent:", error)
    return NextResponse.json({ error: "Failed to update AI agent" }, { status: 500 })
  }
}
