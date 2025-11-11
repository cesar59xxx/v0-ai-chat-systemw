import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import { getSupabaseConfig } from "./config"

export function createBrowserClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createSupabaseBrowserClient(url, anonKey)
}
