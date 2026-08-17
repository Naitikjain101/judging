import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPortalPrefix } from "./portals";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

// ── Portal-aware server client ──────────────────────────────────────
// Reads / writes cookies with a portal-specific prefix so that each
// portal (organizer, registration, volunteer, judge) maintains its own
// independent authentication session.

export async function createPortalClient(portal) {
  const cookieStore = await cookies();
  const prefix = getPortalPrefix(portal);

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const all = cookieStore.getAll();
        if (!prefix) return all;
        return all
          .filter((c) => c.name.startsWith(prefix))
          .map((c) => ({ ...c, name: c.name.slice(prefix.length) }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(prefix + name, value, options)
          );
        } catch {
          // Called from a Server Component during render — ignore
        }
      },
    },
  });
}

// ── Legacy / fallback client (no portal prefix) ─────────────────────
// Kept for backward compatibility. Prefer createPortalClient(portal).
export async function createClient() {
  const cookieStore = await cookies();

  if (SUPABASE_URL === "https://dummy.supabase.co") {
    console.error("CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
          // Called from a Server Component during render — ignore
        }
      },
    },
  });
}

// ── Non-persisting client for two-phase auth flows ──────────────────
// Signs in without committing any cookies. Used when we need to
// determine the user's role before choosing which portal cookie to set
// (e.g. staff login → registration or volunteer).
export function createAuthFlowClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return []; },
      setAll() { /* intentionally discarded */ },
    },
  });
}

// ── Admin client — service role key, server-only ────────────────────
// Used to create / update / delete Supabase Auth accounts.
// NEVER expose the service-role key in client bundles.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local — required for admin operations."
    );
  }

  return createServerClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
