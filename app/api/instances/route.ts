import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json([])
    }

    const { data: instances, error } = await supabase
      .from("instances")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      // This error is expected when database hasn't been set up yet
      if (error.code !== "PGRST205") {
        console.error("[v0] Error fetching instances:", error)
      }
      return NextResponse.json([])
    }

    return NextResponse.json(instances || [])
  } catch (error) {
    console.error("[v0] Error fetching instances:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { name, phone_number } = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: instance, error: instanceError } = await supabase
      .from("instances")
      .insert({ name, phone_number, user_id: user.id, status: "connecting" })
      .select()
      .single()

    if (instanceError) throw instanceError

    try {
      console.log("[v0] Calling webhook with:", { name: instance.name, instanceId: instance.id })

      const webhookResponse = await fetch("https://n8n-n8n.sfxb4x.easypanel.host/webhook/criando-instancia-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: instance.name, instanceId: instance.id }),
      })

      console.log("[v0] Webhook response status:", webhookResponse.status)

      if (webhookResponse.ok) {
        // Try to read as text first
        const responseText = await webhookResponse.text()
        console.log("[v0] Webhook response (first 100 chars):", responseText.substring(0, 100))

        let qrCodeData = null

        // Check if response is a data URL (starts with "data:")
        if (responseText.startsWith("data:")) {
          console.log("[v0] Response is a data URL")
          qrCodeData = responseText
        } else {
          // Try to parse as JSON
          try {
            const webhookData = JSON.parse(responseText)
            console.log("[v0] Response is JSON, keys:", Object.keys(webhookData))

            // Try different possible field names
            qrCodeData = webhookData.qrCode || webhookData.qr_code || webhookData.image || webhookData.base64

            // If it's a base64 string without data URL prefix, add it
            if (qrCodeData && !qrCodeData.startsWith("data:")) {
              qrCodeData = `data:image/png;base64,${qrCodeData}`
            }
          } catch (jsonError) {
            console.error("[v0] Response is not JSON, treating as base64:", jsonError)
            // Assume it's raw base64
            qrCodeData = `data:image/png;base64,${responseText}`
          }
        }

        if (qrCodeData) {
          console.log("[v0] Saving QR code to database (length:", qrCodeData.length, ")")
          const { error: updateError } = await supabase
            .from("instances")
            .update({ qr_code: qrCodeData })
            .eq("id", instance.id)

          if (updateError) {
            console.error("[v0] Error updating QR code:", updateError)
          } else {
            console.log("[v0] QR code saved successfully")
          }
        } else {
          console.log("[v0] No QR code data found in response")
        }
      } else {
        console.error("[v0] Webhook returned error status:", webhookResponse.status)
      }
    } catch (webhookError) {
      console.error("[v0] Error calling webhook:", webhookError)
      // Continue even if webhook fails - user can regenerate QR code later
    }

    // Create default AI agent for this instance
    const { error: agentError } = await supabase.from("ai_agents").insert({
      instance_id: instance.id,
      name: `Assistente ${name}`,
      system_prompt:
        "Você é um assistente virtual prestativo e profissional. Responda de forma clara, objetiva e amigável. Sempre mantenha um tom cordial e ajude o cliente da melhor forma possível.",
    })

    if (agentError) throw agentError

    return NextResponse.json(instance)
  } catch (error) {
    console.error("[v0] Error creating instance:", error)
    return NextResponse.json({ error: "Failed to create instance" }, { status: 500 })
  }
}
