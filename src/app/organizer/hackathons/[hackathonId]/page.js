import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import OrganizerTopbar from "@/components/OrganizerTopbar";
import TerminalPath from "@/components/TerminalPath";
import HackathonTabs from "@/components/hackathon/HackathonTabs";
import { setHackathonStatus } from "@/app/organizer/hackathons/actions";

export default async function HackathonDetailPage({ params }) {
  const { hackathonId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/organizer/login");

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("id, name, description, status, created_by, check_in_rule")
    .eq("id", hackathonId)
    .single();

  if (!hackathon) notFound();
  
  if (hackathon.created_by !== userData.user.id) {
    redirect("/organizer/dashboard");
  }

  const [{ data: teams }, { data: judges }, { data: rounds }, { data: packages }, { data: purchases }, { data: distributions }, { data: staff }] = await Promise.all([
    supabase.from("teams").select("id, name, members, team_code, status, leader_name, email, phone, food_purchased, food_payment_status, food_quantity, team_number, table_number").eq("hackathon_id", hackathonId).order("created_at"),
    supabase.from("judges").select("id, name, judge_code, company, designation, auth_user_id").eq("hackathon_id", hackathonId).order("created_at"),
    supabase.from("rounds").select("id, name, status, order_index").eq("hackathon_id", hackathonId).order("order_index"),
    supabase.from("food_packages").select("*").eq("hackathon_id", hackathonId),
    supabase.from("food_purchases").select("*").eq("hackathon_id", hackathonId),
    supabase.from("coupon_distributions").select("*").eq("hackathon_id", hackathonId),
    supabase.from("staff").select("id, name, role, staff_code").eq("hackathon_id", hackathonId).order("created_at")
  ]);

  return (
    <div className="shell">
      <OrganizerTopbar email={userData.user.email} />
      <div className="page">
        <TerminalPath user="organizer" segments={["hackathons", hackathon.name]} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="title">{hackathon.name}</h1>
            {hackathon.description && <p className="muted">{hackathon.description}</p>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
          </div>
        </div>

        <HackathonTabs 
          hackathonId={hackathonId} 
          hackathon={hackathon}
          teams={teams || []} 
          judges={judges || []} 
          rounds={rounds || []}
          packages={packages || []}
          purchases={purchases || []}
          distributions={distributions || []}
          staff={staff || []}
        />
      </div>
    </div>
  );
  }
