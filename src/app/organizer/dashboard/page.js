import { createPortalClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrganizerTopbar from "@/components/OrganizerTopbar";
import TerminalPath from "@/components/TerminalPath";
import HackathonList from "@/components/organizer/HackathonList";
import { createHackathon } from "../hackathons/actions";

export default async function OrganizerDashboard() {
  try {
    const supabase = await createPortalClient("organizer");
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (!userData?.user) {
      redirect("/organizer/login");
    }

    const { data: hackathons, error: fetchError } = await supabase
      .from("hackathons")
      .select("id, name, description, status, created_at")
      .eq("created_by", userData.user.id)
      .order("created_at", { ascending: false });

    // Distinguish between error and empty states
    if (fetchError) {
      return (
        <div className="shell">
          <OrganizerTopbar email={userData.user.email} />
          <div className="page">
            <TerminalPath user="organizer" segments={["dashboard"]} />
            <h1 className="title" style={{ marginBottom: '2rem' }}>Dashboard</h1>
            <div className="alert alert-error">
              Failed to load hackathons: {fetchError.message}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="shell">
        <OrganizerTopbar email={userData.user.email} />
        <div className="page">
          <TerminalPath user="organizer" segments={["dashboard"]} />
          <h1 className="title" style={{ marginBottom: '2rem' }}>
            Dashboard
          </h1>

          <HackathonList initialHackathons={hackathons || []} createAction={createHackathon} />
        </div>
      </div>
    );
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return (
      <div style={{ padding: 40, color: 'red' }}>
        <h2>Server Error:</h2>
        <pre>{err.message}</pre>
      </div>
    );
  }
}
