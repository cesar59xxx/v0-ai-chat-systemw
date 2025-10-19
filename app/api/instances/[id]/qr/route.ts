import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: instance, error: fetchError } = await supabase.from("instances").select("*").eq("id", id).single()

    if (fetchError || !instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 })
    }

    if (instance.qr_code) {
      return NextResponse.json({
        qr_code: instance.qr_code,
        status: instance.status,
      })
    }

    try {
      const webhookResponse = await fetch("https://n8n-n8n.sfxb4x.easypanel.host/webhook/criando-instancia-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: instance.name, instanceId: instance.id }),
      })

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json()
        let qrCodeData = webhookData.qrCode || webhookData.qr_code || webhookData.image

        if (qrCodeData && !qrCodeData.startsWith("data:")) {
          qrCodeData = `data:image/png;base64,${qrCodeData}`
        }

        if (qrCodeData) {
          // Save QR code to database
          await supabase.from("instances").update({ qr_code: qrCodeData, status: "connecting" }).eq("id", id)

          return NextResponse.json({
            qr_code: qrCodeData,
            status: "connecting",
          })
        }
      }
    } catch (webhookError) {
      console.error("[v0] Error calling webhook:", webhookError)
    }

    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  } catch (error) {
    console.error("[v0] Error generating QR code:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
