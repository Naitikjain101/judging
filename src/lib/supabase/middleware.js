import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getPortalFromPath, getPortalPrefix, PORTALS, isPublicPath } from "./portals";

/**
 * Portal-aware session middleware.
 *
 * For each incoming request the middleware:
 *   1. Detects the portal from the URL path
 *   2. Reads only that portal's cookies (via prefix)
 *   3. Refreshes the auth token (writing back to portal cookies)
 *   4. Validates the user's role matches the portal
 *   5. Redirects to the portal's login if validation fails
 *
 * Because each portal uses its own cookie namespace, logging in / out
 * in one portal never affects another — even across browser tabs.
 */
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables!");
      return response;
    }

    const pathname = request.nextUrl.pathname;

    // Public / auth pages — no session check needed
    if (isPublicPath(pathname)) {
      return response;
    }

    const portal = getPortalFromPath(pathname);
    const prefix = getPortalPrefix(portal);

    // Create a Supabase client scoped to this portal's cookies
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          const all = request.cookies.getAll();
          if (!prefix) return all;
          return all
            .filter((c) => c.name.startsWith(prefix))
            .map((c) => ({ ...c, name: c.name.slice(prefix.length) }));
        },
        setAll(cookiesToSet) {
          // Write prefixed cookies into both the request (for downstream)
          // and the response (for the browser).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(prefix + name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(prefix + name, value, options)
          );
        },
      },
    });

    // Refresh the token — this is the primary job of the middleware
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── No valid session → redirect to portal login ──
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = PORTALS[portal]?.loginPath || "/";
      return NextResponse.redirect(loginUrl);
    }

    // ── Portal-level role enforcement ──
    const role = user.user_metadata?.role || "";
    const email = user.email || "";

    if (portal === "organizer") {
      // Real human users only — reject synthetic judge / staff emails
      if (
        email.endsWith("@judge.hu.local") ||
        email.endsWith("@staff.hu.local")
      ) {
        return redirectTo(request, "/");
      }
    }

    if (portal === "registration") {
      if (role !== "Registration Desk") {
        return redirectTo(request, "/staff/login");
      }
    }

    if (portal === "volunteer") {
      if (role !== "Volunteer") {
        return redirectTo(request, "/staff/login");
      }
    }

    if (portal === "judge") {
      if (!email.endsWith("@judge.hu.local")) {
        return redirectTo(request, "/");
      }
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return response;
  }
}

function redirectTo(request, path) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  return NextResponse.redirect(url);
}
