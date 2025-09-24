import { createServerClient } from "@supabase/ssr"

// Creates a Supabase client with service role (server-only). Never import in client components.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var")

  // No cookie handling needed for service tasks
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}
