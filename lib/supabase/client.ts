import { createBrowserClient } from "@supabase/ssr"

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  _supabase = createBrowserClient(url, anon)
  return _supabase
}
