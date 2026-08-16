import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import OrganizerTopbar from "@/components/OrganizerTopbar";
import TerminalPath from "@/components/TerminalPath";
import CriteriaPanel from "@/components/round/CriteriaPanel";
import TeamSelectionPanel from "@/components/round/TeamSelectionPanel";
import JudgeAssignmentPanel from "@/components/round/JudgeAssignmentPanel";
import JudgeProgressPanel from "@/components/round/JudgeProgressPanel";
import { setRoundStatus } from "@/app/organizer/hackathons/actions";

export default async function RoundDetailPage({ params }) {
  const { hackathonId, roundId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/organizer/login");

  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single();
  if (!round) notFound();

  const { data: hackathon } = await supabase.from("hackathons").select("id, name").eq("id", hackathonId).single();

  const [{ data: allTeams }, { data: roundTeamRows }, { data: judges }, { data: criteria }, { data: assignments }, { data: previousRound }, { data: submissions }] =
    await Promise.all([
      supabase.from("teams").select("id, name, team_code").eq("hackathon_id", hackathonId).order("name"),
      supabase.from("round_teams").select("team_id").eq("round_id", roundId),
      supabase.from("judges").select("id, name, judge_code").eq("hackathon_id", hackathonId).order("created_at"),
      supabase.from("criteria").select("*").eq("round_id", roundId).order("order_index"),
      supabase.from("round_judge_assignments").select("judge_id, team_id").eq("round_id", roundId),
      supabase
        .from("rounds")
        .select("id")
        .eq("hackathon_id", hackathonId)
        .lt("order_index", round.order_index)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("submissions").select("judge_id, team_id, submitted").eq("round_id", roundId)
    ]);

  const selectedTeamIds = (roundTeamRows || []).map((r) => r.team_id);
  const roundTeams = (allTeams || []).filter((t) => selectedTeamIds.includes(t.id));

  return (
    <div className="shell">
      <OrganizerTopbar email={userData.user.email} />
      <div className="page">
        <TerminalPath user="organizer" segments={["hackathons", hackathon?.name, round.name]} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="title">{round.name}</h1>
            <Link href={`/organizer/hackathons/${hackathonId}`} className="muted" style={{ fontSize: 13 }}>
              ← back to {hackathon?.name}
            </Link>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["upcoming", "active", "completed"].map((s) => (
              <form key={s} action={async () => { "use server"; await setRoundStatus(hackathonId, roundId, s); }}>
                <button className={`btn btn-sm ${round.status === s ? "btn-primary" : "btn-secondary"}`}>
                  {s}
                </button>
              </form>
            ))}
            <Link href={`/organizer/hackathons/${hackathonId}/rounds/${roundId}/results`} className="btn btn-secondary btn-sm">
              Results →
            </Link>
          </div>
        </div>

        <JudgeProgressPanel 
          judges={judges || []}
          assignments={assignments || []}
          submissions={submissions || []}
        />

        <CriteriaPanel hackathonId={hackathonId} roundId={roundId} criteria={criteria || []} />

        <TeamSelectionPanel
          hackathonId={hackathonId}
          roundId={roundId}
          allTeams={allTeams || []}
          selectedTeamIds={selectedTeamIds}
          previousRoundId={previousRound?.id || null}
        />

        <div className="card">
          <JudgeAssignmentPanel
            hackathonId={hackathonId}
            roundId={roundId}
            judges={judges || []}
            roundTeams={roundTeams}
            assignments={assignments || []}
          />
        </div>
      </div>
    </div>
  );
}
