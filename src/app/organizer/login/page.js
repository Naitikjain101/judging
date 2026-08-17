import { createPortalClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import TerminalPath from "@/components/TerminalPath";
import OrganizerLoginForm from "@/components/organizer/OrganizerLoginForm";

export default async function OrganizerLoginPage({ searchParams }) {
  try {
    const params = await searchParams;
    const supabase = await createPortalClient("organizer");
    const { data: userData } = await supabase.auth.getUser();

    if (userData?.user) {
      redirect("/organizer/dashboard");
    }

    return (
      <div className="shell">
        <div className="page-narrow" style={{ paddingTop: 60 }}>
          <TerminalPath segments={["organizer", "login"]} />
          <h1 className="title" style={{ marginBottom: 24 }}>
            Organizer login
          </h1>

          {params?.error && <div className="alert alert-error">{params.error}</div>}

          <div className="card">
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Sign in to create and manage hackathons.
            </p>
            <OrganizerLoginForm />
            <div style={{ margin: "20px 0", textAlign: "center", color: "#666", fontSize: 13 }}>
              &mdash; OR &mdash;
            </div>
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return (
      <div style={{ padding: 40, color: 'red' }}>
        <h2>Login Page Error:</h2>
        <pre>{err.message}</pre>
      </div>
    );
  }
}
