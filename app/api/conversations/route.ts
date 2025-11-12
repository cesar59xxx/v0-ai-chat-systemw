import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get("instance_id")

    console.log("[v0] API: Fetching conversations for user:", user.id)

    let query = supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })

    if (instanceId) {
      query = query.eq("instance_id", instanceId)
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

    return NextResponse.json(conversations || [])
  } catch (error) {
    console.error("[v0] API: Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
