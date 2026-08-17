/**
 * Portal configuration for multi-tab independent sessions.
 *
 * Each portal (organizer, registration, volunteer, judge) stores its
 * Supabase auth tokens in a unique set of cookies (via a name-prefix).
 * This allows a single browser to hold independent sessions for every
 * portal simultaneously — login / logout in one tab never affects another.
 */

export const PORTALS = {
  organizer: {
    prefix: "org_",
    loginPath: "/organizer/login",
    dashboardPath: "/organizer/dashboard",
  },
  registration: {
    prefix: "reg_",
    loginPath: "/staff/login",
    dashboardPath: "/registration",
  },
  volunteer: {
    prefix: "vol_",
    loginPath: "/staff/login",
    dashboardPath: "/volunteer",
  },
  judge: {
    prefix: "jdg_",
    loginPath: "/judge/login",
    dashboardPath: "/judge/dashboard",
  },
  staff: {
    // Staff login page itself — not a dashboard portal
    prefix: "stf_",
    loginPath: "/staff/login",
    dashboardPath: "/",
  },
  public: {
    prefix: "",
    loginPath: "/",
    dashboardPath: "/",
  },
};

/**
 * Determine which portal a URL path belongs to.
 */
export function getPortalFromPath(pathname) {
  if (pathname.startsWith("/organizer")) return "organizer";
  if (pathname.startsWith("/registration")) return "registration";
  if (pathname.startsWith("/volunteer")) return "volunteer";
  if (pathname.startsWith("/judge")) return "judge";
  if (pathname.startsWith("/staff")) return "staff";
  return "public";
}

export function getPortalPrefix(portal) {
  return PORTALS[portal]?.prefix ?? "";
}

export function getPortalLoginPath(portal) {
  return PORTALS[portal]?.loginPath ?? "/";
}

/**
 * True for paths that should be accessible without authentication
 * (login pages, signup pages, OAuth callback, landing page).
 */
export function isPublicPath(pathname) {
  return (
    pathname === "/" ||
    pathname.startsWith("/organizer/login") ||
    pathname.startsWith("/organizer/signup") ||
    pathname.startsWith("/organizer/auth") ||
    pathname.startsWith("/judge/login") ||
    pathname.startsWith("/staff/login") ||
    pathname.startsWith("/public")
  );
}
