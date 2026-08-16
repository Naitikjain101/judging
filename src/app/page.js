import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingClient from "@/components/landing/LandingClient";

const JUDGE_AUTH_DOMAIN = process.env.JUDGE_AUTH_DOMAIN || "judge.hu.local";

export default async function Home() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (userData?.user) {
    const email = userData.user.email || "";
    if (email.endsWith('@staff.hu.local')) {
      const role = userData.user.user_metadata?.role;
      if (role === "Registration Desk") {
        redirect("/registration");
      } else if (role === "Volunteer") {
        redirect("/volunteer");
      } else {
        redirect("/staff/login");
      }
    } else if (email.endsWith(`@${JUDGE_AUTH_DOMAIN}`)) {
      redirect("/judge/dashboard");
    } else {
      redirect("/organizer/dashboard");
    }
  }

  return <LandingClient />;
}
