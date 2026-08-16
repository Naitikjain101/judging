import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use inside Server Components, Server Actions, and Route Handlers.
export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

  if (url === "https://dummy.supabase.co") {
    console.error("CRITICAL ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in Server Component.");
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component during render
          }
        },
      },
    }
  );
}

// Admin client — service role key, server-only. Used to create/update the
// Supabase Auth accounts that back judge logins. Never import this from
// a Client Component or expose the key with a NEXT_PUBLIC_ prefix.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local file. This is required to create auth users.");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
