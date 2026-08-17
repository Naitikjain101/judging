import { createBrowserClient } from "@supabase/ssr";
import { getPortalFromPath, getPortalPrefix } from "./portals";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

/**
 * Parse document.cookie into an array of { name, value } objects.
 */
function parseBrowserCookies() {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split(";")
    .map((c) => {
      const [rawName, ...rest] = c.trim().split("=");
      return { name: rawName || "", value: rest.join("=") };
    })
    .filter((c) => c.name);
}

/**
 * Portal-aware browser Supabase client.
 *
 * Automatically detects the current portal from window.location.pathname
 * and scopes all cookie reads/writes to that portal's namespace.
 * This means createClient() in the organizer portal only sees organizer
 * cookies, and the judge portal only sees judge cookies — no cross-talk.
 *
 * @param {string} [portalOverride] - Force a specific portal (for special cases)
 */
export function createClient(portalOverride) {
  const portal =
    portalOverride ||
    (typeof window !== "undefined"
      ? getPortalFromPath(window.location.pathname)
      : "public");
  const prefix = getPortalPrefix(portal);

  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        const all = parseBrowserCookies();
        if (!prefix) return all;
        return all
          .filter((c) => c.name.startsWith(prefix))
          .map((c) => ({ ...c, name: c.name.slice(prefix.length) }));
      },
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return;
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieName = prefix + name;
          let cookie = `${cookieName}=${value}; path=${options?.path || "/"}`;
          if (options?.maxAge != null) cookie += `; max-age=${options.maxAge}`;
          if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;
          if (options?.secure) cookie += "; Secure";
          document.cookie = cookie;
        });
      },
    },
  });
}
