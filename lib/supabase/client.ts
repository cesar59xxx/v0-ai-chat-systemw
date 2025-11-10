import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = []
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!supabaseAnonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    throw new Error(
      `Variáveis de ambiente não configuradas: ${missingVars.join(", ")}. ` +
        `Configure estas variáveis no painel da Vercel em Settings > Environment Variables.`,
    )
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}
