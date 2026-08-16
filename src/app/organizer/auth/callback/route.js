import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const admin = createAdminClient();

      // Only insert a profile row if one doesn't already exist
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

  return NextResponse.redirect(`${origin}/organizer/dashboard`);
}
