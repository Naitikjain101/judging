"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUpOrganizer(prevState, formData) {
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

  redirect("/organizer/dashboard");
}

export async function logInOrganizer(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/organizer/dashboard");
}
