import { createClient, createAdminClient, createPortalClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/organizer/login`);
  }

  // 1. Exchange the code using the un-prefixed client so it can read the un-prefixed PKCE cookies
  // We use createClient() because it correctly implements getAll() to read cookies from the request.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user || !data.session) {
    console.error("OAuth Exchange Error:", error);
    return NextResponse.redirect(`${origin}/organizer/login?error=auth_failed`);
  }

  // 2. Determine Role and Target Portal
  let portal = "organizer";
  let redirectPath = "/organizer/dashboard";
  
  const email = data.user.email || "";
  const admin = createAdminClient();

  if (email.endsWith("@judge.hu.local")) {
    portal = "judge";
    redirectPath = "/judge/dashboard";
  } else if (email.endsWith("@staff.hu.local")) {
    const userRole = data.user.user_metadata?.role;
    if (userRole === "Registration Desk") {
      portal = "registration";
      redirectPath = "/registration";
    } else {
      portal = "volunteer";
      redirectPath = "/volunteer";
    }
  } else {
    // Check if they are a judge in the database
    const { data: judgeData } = await admin.from("judges").select("id").eq("auth_user_id", data.user.id).maybeSingle();
    if (judgeData) {
      portal = "judge";
      redirectPath = "/judge/dashboard";
    } else {
      // Check if they are staff in the database
      const { data: staffData } = await admin.from("staff").select("role").eq("auth_user_id", data.user.id).maybeSingle();
      if (staffData) {
        if (staffData.role === "Registration Desk") {
          portal = "registration";
          redirectPath = "/registration";
        } else {
          portal = "volunteer";
          redirectPath = "/volunteer";
        }
      } else {
        // Default to organizer
        portal = "organizer";
        redirectPath = "/organizer/dashboard";
        
        // Ensure organizer profile exists
        const { data: existingProfile } = await admin
          .from("organizer_profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          const fullName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email;

          await admin.from("organizer_profiles").insert({
            id: data.user.id,
            full_name: fullName,
          });
        }
      }
    }
  }

  // 3. Establish the session in the target portal's namespace
  // We use the portal client to explicitly set the session cookies with the correct prefix.
  const portalClient = await createPortalClient(portal);
  
  // Set the session. This writes the cookies (e.g., org_sb-...-auth-token) to the response headers.
  await portalClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
