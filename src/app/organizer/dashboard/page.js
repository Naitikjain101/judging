import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrganizerTopbar from "@/components/OrganizerTopbar";
import TerminalPath from "@/components/TerminalPath";
import HackathonList from "@/components/organizer/HackathonList";
import { createHackathon } from "../hackathons/actions";

export default async function OrganizerDashboard() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      redirect("/organizer/login");
    }

    const { data: hackathons } = await supabase
      .from("hackathons")
      .select("id, name, description, status, created_at")
      .eq("created_by", userData.user.id)
      .order("created_at", { ascending: false });

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
    if (err.message === "NEXT_REDIRECT") throw err;
    return (
      <div style={{ padding: 40, color: 'red' }}>
        <h2>Server Component Error in Dashboard:</h2>
        <pre>{err.message}</pre>
        <pre>{err.stack}</pre>
      </div>
    );
  }
}
