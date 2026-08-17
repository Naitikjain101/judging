import { createPortalClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JudgeLoginForm from "@/components/judge/JudgeLoginForm";
import TerminalPath from "@/components/TerminalPath";

export default async function JudgeLoginPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createPortalClient("judge");
  const { data: userData } = await supabase.auth.getUser();

  if (userData?.user) {
    redirect("/judge/dashboard");
  }

  return (
    <div className="shell">
      <div className="page-narrow" style={{ paddingTop: 60 }}>
        <TerminalPath segments={["judge", "login"]} />
        <h1 className="title" style={{ marginBottom: 24 }}>
          Judge login
        </h1>
        
        {params?.error && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            {params.error === "session_invalidated"
              ? "Your session was invalidated because you logged in on another device."
              : params.error}
          </div>
        )}

        <JudgeLoginForm />

        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Don&apos;t have an ID? Ask your hackathon organizer.
        </p>
      </div>
    </div>
  );
}
