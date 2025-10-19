import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const instanceName = searchParams.get("instance_name")?.trim() // Added trim to remove whitespace

    console.log("[v0] API: Fetching conversations, instance_name filter:", instanceName)

    let query = supabase.from("conversations").select("*").order("last_message_at", { ascending: false })

    if (instanceName) {
      query = query.ilike("instance_name", `%${instanceName}%`)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error("[v0] API: Database error:", error)
      if (error.code !== "PGRST205") {
        console.error("[v0] API: Unexpected error code:", error.code)
      }
      return NextResponse.json([])
    }

    console.log("[v0] API: Conversations found:", conversations?.length || 0)
    if (conversations && conversations.length > 0) {
      console.log("[v0] API: First conversation:", conversations[0])
    }

    return NextResponse.json(conversations || [])
  } catch (error) {
    console.error("[v0] API: Error fetching conversations:", error)
    return NextResponse.json([])
  }
}
