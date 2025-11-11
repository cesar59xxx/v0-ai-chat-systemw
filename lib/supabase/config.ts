// Estas variáveis são injetadas em build-time pelo Next.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function getSupabaseConfig() {
  // Log para debug (será visível no console do navegador)
  if (typeof window !== "undefined") {
    console.log("[v0] Supabase Config Check:")
    console.log("  - URL presente:", !!SUPABASE_URL)
    console.log("  - URL valor:", SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : "undefined")
    console.log("  - Key presente:", !!SUPABASE_ANON_KEY)
    console.log("  - Key valor:", SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : "undefined")
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missingVars = []
    if (!SUPABASE_URL) missingVars.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!SUPABASE_ANON_KEY) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    throw new Error(
      `❌ Variáveis de ambiente ausentes: ${missingVars.join(", ")}\n\n` +
        `Por favor:\n` +
        `1. Acesse o painel da Vercel\n` +
        `2. Vá em Settings > Environment Variables\n` +
        `3. Adicione as variáveis para Production, Preview e Development\n` +
        `4. Faça um novo deploy (Deployments > ... > Redeploy)\n\n` +
        `Mais info: https://vercel.com/docs/concepts/projects/environment-variables`,
    )
  }

  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  }
}

// Validar configuração imediatamente ao importar (apenas no cliente)
if (typeof window !== "undefined") {
  try {
    getSupabaseConfig()
    console.log("[v0] ✅ Configuração do Supabase válida")
  } catch (error) {
    console.error("[v0] ❌ Erro na configuração do Supabase:", error)
  }
}
