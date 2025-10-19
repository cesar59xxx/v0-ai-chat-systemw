import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: instance, error: fetchError } = await supabase
      .from("instances")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError || !instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 })
    }

    // In production, you would check the actual WhatsApp connection status here
    // For demo purposes, we'll simulate a connection after some time
    if (instance.status === "connecting") {
      const shouldConnect = Math.random() > 0.7
      if (shouldConnect) {
        const { error: updateError } = await supabase
          .from("instances")
          .update({
            status: "connected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (updateError) throw updateError

        return NextResponse.json({ status: "connected" })
      }
    }

    return NextResponse.json({ status: instance.status })
  } catch (error) {
    console.error("[v0] Error checking status:", error)
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
  }
}
