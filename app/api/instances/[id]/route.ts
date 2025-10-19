import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { error } = await supabase
      .from("instances")
      .update({ whatsapp_instance_id: body.whatsapp_instance_id })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating instance:", error)
    return NextResponse.json({ error: "Failed to update instance" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase.from("instances").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting instance:", error)
    return NextResponse.json({ error: "Failed to delete instance" }, { status: 500 })
  }
}
