import { createClient } from "@/lib/supabase/server";
import TerminalPath from "@/components/TerminalPath";
import CheckInDashboard from "@/components/registration/CheckInDashboard";

export default async function RegistrationPage() {
  const supabase = await createClient();

  // Fetch all active hackathons to select which one to check teams into
  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("id, name, status")
    .eq("status", "active");

  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      <TerminalPath user="registration-desk" segments={["dashboard"]} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title" style={{ margin: 0 }}>Team Check-in</h1>
      </div>

      {hackathons && hackathons.length > 0 ? (
        <CheckInDashboard hackathons={hackathons} />
      ) : (
        <div className="empty">No active hackathons found. Please ask an organizer to set a hackathon to active.</div>
      )}
    </div>
  );
}
