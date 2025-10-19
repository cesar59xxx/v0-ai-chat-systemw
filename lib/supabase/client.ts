import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Variáveis de ambiente do Supabase não configuradas")
    throw new Error("Configuração do Supabase incompleta")
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}
