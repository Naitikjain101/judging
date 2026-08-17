"use server";

import { createAuthFlowClient, createPortalClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const STAFF_AUTH_DOMAIN = process.env.STAFF_AUTH_DOMAIN || "staff.hu.local";

/**
 * Staff login — two-phase flow.
 *
 * Phase 1: Authenticate with a non-persisting client to determine the
 *          user's role (Registration Desk or Volunteer).
 * Phase 2: Sign in again with the correct portal-specific client so
 *          auth cookies land in the right namespace.
 *
 * This ensures that registration desk and volunteer sessions are stored
 * in separate cookie namespaces and never overwrite each other or the
 * organizer/judge sessions.
 */
export async function logInStaff(prevState, formData) {
  let targetPortal = null;

  try {
    const staffCode = formData.get("staffCode")?.trim().toUpperCase();
    const password = formData.get("password");

    if (!staffCode || !password) return { error: "Enter your staff code and password." };

    const email = `${staffCode.toLowerCase()}@${STAFF_AUTH_DOMAIN}`;

    // Phase 1 — authenticate without persisting to discover the role
    const authClient = createAuthFlowClient();
    const { error: authError, data: authData } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) return { error: "Invalid staff code or password." };

    const role = authData.user?.user_metadata?.role;
    if (role === "Registration Desk") {
      targetPortal = "registration";
    } else if (role === "Volunteer") {
      targetPortal = "volunteer";
    } else {
      return { error: "Unknown staff role." };
    }

    // Phase 2 — sign in with the portal-specific client so cookies
    // are stored in the correct namespace
    const portalClient = await createPortalClient(targetPortal);
    const { error: portalError } = await portalClient.auth.signInWithPassword({
      email,
      password,
    });

    if (portalError) return { error: "Login failed. Please try again." };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("logInStaff error:", err);
    return { error: err.message || "An unexpected error occurred." };
  }

  if (targetPortal === "registration") {
    redirect("/registration");
  } else {
    redirect("/volunteer");
  }
}

export async function logOutRegistration() {
  const supabase = await createPortalClient("registration");
  await supabase.auth.signOut();
  redirect("/staff/login");
}

export async function logOutVolunteer() {
  const supabase = await createPortalClient("volunteer");
  await supabase.auth.signOut();
  redirect("/staff/login");
}
