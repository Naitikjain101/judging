import { createPortalClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TerminalPath from "@/components/TerminalPath";
import CheckInDashboard from "@/components/registration/CheckInDashboard";

export default async function RegistrationPage() {
  const supabase = await createPortalClient("registration");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/staff/login");

  // Look up the staff member's assigned hackathon — NOT all active hackathons
  const admin = createAdminClient();
  const { data: staffRecord, error: staffErr } = await admin
    .from("staff")
    .select("id, hackathon_id, role, name")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (staffErr || !staffRecord) {
    return (
      <div className="page" style={{ maxWidth: 1400 }}>
        <TerminalPath user="registration-desk" segments={["dashboard"]} />
        <div className="alert alert-error" style={{ marginTop: "2rem" }}>
          Staff record not found. Contact your organizer.
        </div>
      </div>
    );
  }

  if (staffRecord.role !== "Registration Desk") {
    return (
      <div className="page" style={{ maxWidth: 1400 }}>
        <TerminalPath user="registration-desk" segments={["dashboard"]} />
        <div className="alert alert-error" style={{ marginTop: "2rem" }}>
          Unauthorized: your account is not assigned as Registration Desk.
        </div>
      </div>
    );
  }

  // Fetch the staff member's hackathon
  const { data: hackathon } = await admin
    .from("hackathons")
    .select("id, name, status, check_in_rule")
    .eq("id", staffRecord.hackathon_id)
    .single();

  if (!hackathon) {
    return (
      <div className="page" style={{ maxWidth: 1400 }}>
        <TerminalPath user="registration-desk" segments={["dashboard"]} />
        <div className="alert alert-error" style={{ marginTop: "2rem" }}>
          Your assigned hackathon was not found. Contact your organizer.
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      <TerminalPath user="registration-desk" segments={[hackathon.name, "check-in"]} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ margin: 0 }}>Team Check-in</h1>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {hackathon.name} • Check-in rule: {hackathon.check_in_rule || "ANY_MEMBER"}
          </p>
        </div>
      </div>

      <CheckInDashboard hackathon={hackathon} />
    </div>
  );
}
