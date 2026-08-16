import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JudgeLoginForm from "@/components/judge/JudgeLoginForm";
import TerminalPath from "@/components/TerminalPath";

const JUDGE_AUTH_DOMAIN = process.env.JUDGE_AUTH_DOMAIN || "judge.hu.local";

export default async function JudgeLoginPage({ searchParams }) {
  const params = await searchParams;
  const errorMsg = params?.error === "session_invalidated" ? "Your session was invalidated because you logged in on another device." : null;

  const supabase = await createClient();
  
  if (errorMsg) {
    await supabase.auth.signOut();
  }
  
  const { data: userData } = await supabase.auth.getUser();

  if (userData?.user && !errorMsg) {
    const email = userData.user.email || "";
    redirect(email.endsWith(`@${JUDGE_AUTH_DOMAIN}`) ? "/judge/dashboard" : "/organizer/dashboard");
  }

  return (
    <div className="shell">
      <div className="page-narrow" style={{ paddingTop: 60 }}>
        <TerminalPath segments={["judge", "login"]} />
        <h1 className="title" style={{ marginBottom: 24 }}>
          Judge login
        </h1>
        
        {errorMsg && <div className="alert alert-error" style={{ marginBottom: 24 }}>{errorMsg}</div>}

        <JudgeLoginForm />

        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Don&apos;t have an ID? Ask your hackathon organizer.
        </p>
      </div>
    </div>
  );
}
