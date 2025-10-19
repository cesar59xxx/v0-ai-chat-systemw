"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, LayoutDashboard, MessageSquare, Settings, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserMenu } from "./user-menu"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Instâncias", href: "/dashboard/instances", icon: Smartphone },
  { name: "Conversas", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="h-16 px-6 flex items-center border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight">AI Chat System</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="h-16 px-3 border-t border-sidebar-border flex items-center">
        <UserMenu />
      </div>
    </div>
  )
}
