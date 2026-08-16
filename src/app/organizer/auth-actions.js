"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUpOrganizer(prevState, formData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");
    const fullName = formData.get("fullName");

    const supabase = await createClient();

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
    console.error("signUpOrganizer error:", err);
    return { error: err.message || "Failed to initialize database client. Please ensure your Vercel Environment Variables are set and you have Redeployed." };
  }

  redirect("/organizer/dashboard");
}

export async function logInOrganizer(prevState, formData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }
  } catch (err) {
    console.error("logInOrganizer error:", err);
    return { error: err.message || "Database connection error. Are the Supabase URL and ANON_KEY set in Vercel?" };
  }

  redirect("/organizer/dashboard");
}
