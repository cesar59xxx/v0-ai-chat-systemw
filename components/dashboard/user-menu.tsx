"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function UserMenu() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("Usuário")

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("[v0] Erro ao buscar usuário:", error.message)
          return
        }

        if (user) {
          setUserEmail(user.email || "")
          setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário")
        }
      } catch (err) {
        console.error("[v0] Erro ao buscar usuário:", err)
        // Não mostra erro para o usuário, apenas loga no console
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
      router.refresh()
    } catch (err) {
      console.error("[v0] Erro ao fazer logout:", err)
    }
  }

  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            {userEmail && <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
