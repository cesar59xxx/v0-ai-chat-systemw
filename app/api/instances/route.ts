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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: instances, error } = await supabase
      .from("instances")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      if (error.code !== "PGRST205") {
        console.error("[v0] Error fetching instances:", error)
      }
      return NextResponse.json([])
    }

    return NextResponse.json(instances || [])
  } catch (error) {
    console.error("[v0] Error fetching instances:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
      .insert({
        name,
        phone_number,
        user_id: user.id,
        status: "connecting",
      })
      .select()
      .single()

    if (instanceError) throw instanceError

    try {
      const webhookUrl = "https://n8n-n8n.bkrnx7.easypanel.host/webhook/criando-instancia-whatsapp"
      const webhookPayload = { name: instance.name, instanceId: instance.id }

      console.log("[v0] ===========================================")
      console.log("[v0] Calling n8n webhook to create instance")
      console.log("[v0] URL:", webhookUrl)
      console.log("[v0] Payload:", JSON.stringify(webhookPayload))
      console.log("[v0] ===========================================")

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      console.log("[v0] Webhook response status:", webhookResponse.status)
      console.log(
        "[v0] Webhook response headers:",
        JSON.stringify(Object.fromEntries(webhookResponse.headers.entries())),
      )

      if (webhookResponse.ok) {
        // Try to read as text first
        const responseText = await webhookResponse.text()
        console.log("[v0] Webhook response length:", responseText.length)
        console.log("[v0] Webhook response (first 200 chars):", responseText.substring(0, 200))

        let qrCodeData = null

        // Check if response is a data URL (starts with "data:")
        if (responseText.startsWith("data:")) {
          console.log("[v0] Response is a data URL (image)")
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
              console.log("[v0] Adding data URL prefix to base64")
              qrCodeData = `data:image/png;base64,${qrCodeData}`
            }
          } catch (jsonError) {
            console.error("[v0] Response is not JSON:", jsonError)
            // Assume it's raw base64
            if (responseText.length > 100) {
              console.log("[v0] Treating as raw base64 string")
              qrCodeData = `data:image/png;base64,${responseText}`
            }
          }
        }

        if (qrCodeData) {
          console.log("[v0] QR code data found, length:", qrCodeData.length)
          const { error: updateError } = await supabase
            .from("instances")
            .update({ qr_code: qrCodeData })
            .eq("id", instance.id)

          if (updateError) {
            console.error("[v0] Error updating QR code in database:", updateError)
          } else {
            console.log("[v0] ✅ QR code saved successfully to database")
          }
        } else {
          console.log("[v0] ⚠️ No QR code data found in webhook response")
        }
      } else {
        const errorText = await webhookResponse.text()
        console.error("[v0] ❌ Webhook returned error status:", webhookResponse.status)
        console.error("[v0] Error response:", errorText)
      }
    } catch (webhookError) {
      console.error("[v0] ❌ Error calling webhook:", webhookError)
      console.error(
        "[v0] Error type:",
        webhookError instanceof Error ? webhookError.constructor.name : typeof webhookError,
      )
      console.error("[v0] Error message:", webhookError instanceof Error ? webhookError.message : String(webhookError))

      // Check if it's a timeout error
      if (webhookError instanceof Error && webhookError.name === "AbortError") {
        console.error("[v0] ⏱️ Webhook request timed out after 30 seconds")
      }

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
