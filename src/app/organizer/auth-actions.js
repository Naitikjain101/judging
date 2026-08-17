"use server";

import { createPortalClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUpOrganizer(prevState, formData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");
    const fullName = formData.get("fullName");

    const supabase = await createPortalClient("organizer");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const admin = createAdminClient();
      const { error: profileError } = await admin
        .from("organizer_profiles")
        .insert({ id: data.user.id, full_name: fullName });
      if (profileError) {
        return { error: profileError.message };
      }
    }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("signUpOrganizer error:", err);
    return { error: err.message || "Failed to sign up." };
  }

  redirect("/organizer/dashboard");
}

export async function logInOrganizer(prevState, formData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = await createPortalClient("organizer");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("logInOrganizer error:", err);
    return { error: err.message || "Database connection error." };
  }

  redirect("/organizer/dashboard");
}

export async function logOutOrganizer() {
  const supabase = await createPortalClient("organizer");
  await supabase.auth.signOut();
  redirect("/organizer/login");
}
