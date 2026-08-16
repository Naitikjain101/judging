"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const STAFF_AUTH_DOMAIN = process.env.STAFF_AUTH_DOMAIN || "staff.hu.local";

export async function logInStaff(prevState, formData) {
  let role = null;
  
  try {
    const staffCode = formData.get("staffCode")?.trim().toUpperCase();
    const password = formData.get("password");

    if (!staffCode || !password) return { error: "Enter your staff code and password." };

    const supabase = await createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email: `${staffCode.toLowerCase()}@${STAFF_AUTH_DOMAIN}`,
      password,
    });

    if (error) return { error: "Invalid staff code or password." };
    
    role = data.user?.user_metadata?.role;
  } catch (err) {
    console.error("logInStaff error:", err);
    return { error: err.message || "Database error. Please check Vercel environment variables and redeploy." };
  }

  if (role === "Registration Desk") {
    redirect("/registration");
  } else if (role === "Volunteer") {
    redirect("/volunteer");
  } else {
    redirect("/"); // fallback
  }
}

export async function logOutStaff() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
