import { createPortalClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TerminalPath from "@/components/TerminalPath";
import FoodDistribution from "@/components/volunteer/FoodDistribution";

export default async function VolunteerPage() {
  const supabase = await createPortalClient("volunteer");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/staff/login");

  // Look up the volunteer's assigned hackathon
  const admin = createAdminClient();
  const { data: staffRecord, error: staffErr } = await admin
    .from("staff")
    .select("id, hackathon_id, role, name")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (staffErr || !staffRecord) {
    return (
      <div className="page" style={{ maxWidth: 1000 }}>
        <TerminalPath user="volunteer" segments={["food-distribution"]} />
        <div className="alert alert-error" style={{ marginTop: "2rem" }}>
          Staff record not found. Contact your organizer.
        </div>
      </div>
    );
  }

  if (staffRecord.role !== "Volunteer") {
    return (
      <div className="page" style={{ maxWidth: 1000 }}>
        <TerminalPath user="volunteer" segments={["food-distribution"]} />
        <div className="alert alert-error" style={{ marginTop: "2rem" }}>
          Unauthorized: your account is not assigned as Food Volunteer.
        </div>
      </div>
    );
  }

  // Fetch hackathon
  const { data: hackathon } = await admin
    .from("hackathons")
    .select("id, name, status")
    .eq("id", staffRecord.hackathon_id)
    .single();

  if (!hackathon) {
    return (
      <div className="page" style={{ maxWidth: 1000 }}>
        <TerminalPath user="volunteer" segments={["food-distribution"]} />
        <div className="alert alert-error" style={{ marginTop: "2rem" }}>
          Your assigned hackathon was not found. Contact your organizer.
        </div>
      </div>
    );
  }

  // Fetch ONLY this hackathon's food packages
  const { data: packages } = await admin
    .from("food_packages")
    .select("*")
    .eq("hackathon_id", hackathon.id)
    .order("name");

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <TerminalPath user="volunteer" segments={[hackathon.name, "food-distribution"]} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="title" style={{ margin: 0 }}>Food Distribution</h1>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{hackathon.name}</p>
        </div>
      </div>

      <FoodDistribution hackathon={hackathon} packages={packages || []} />
    </div>
  );
}
