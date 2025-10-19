"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Database } from "lucide-react"
import Link from "next/link"

export function SetupBanner() {
  const [needsSetup, setNeedsSetup] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSetup()
  }, [])

  async function checkSetup() {
    try {
      const response = await fetch("/api/instances")

      // If we get a 404, it means the table doesn't exist
      if (response.status === 404) {
        setNeedsSetup(true)
        setLoading(false)
        return
      }

      // If response is ok, check if we got data
      if (response.ok) {
        const data = await response.json()
        // If we got an empty array, tables exist but no data yet - that's fine
        if (Array.isArray(data) && data.length === 0) {
          setNeedsSetup(false)
        }
      }
    } catch (error) {
      // If there's any error, assume we need setup
      setNeedsSetup(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !needsSetup) return null

  return (
    <Alert className="border-orange-500/50 bg-orange-500/10">
      <AlertCircle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          O banco de dados precisa ser configurado. Execute o script Python para criar as tabelas necessárias.
        </span>
        <Link href="/dashboard/setup">
          <Button size="sm" variant="outline" className="ml-4 bg-transparent">
            <Database className="w-4 h-4 mr-2" />
            Configurar Agora
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
