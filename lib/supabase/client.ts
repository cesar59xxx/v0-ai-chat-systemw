import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
      console.error("[v0] Variáveis de ambiente do Supabase não configuradas")
    }
    // Retorna um cliente vazio durante o build/pre-render
    return null
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}
