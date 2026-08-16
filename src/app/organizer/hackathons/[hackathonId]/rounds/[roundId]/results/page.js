import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import OrganizerTopbar from "@/components/OrganizerTopbar";
import TerminalPath from "@/components/TerminalPath";
import ResultsView from "@/components/round/ResultsView";

export default async function RoundResultsPage({ params }) {
  const { hackathonId, roundId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/organizer/login");

  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single();
  if (!round) notFound();

  const { data: hackathon } = await supabase.from("hackathons").select("id, name").eq("id", hackathonId).single();

  const [{ data: roundTeamRows }, { data: allTeams }, { data: judges }, { data: criteria }, { data: assignments }, { data: submissions }] =
    await Promise.all([
      supabase.from("round_teams").select("team_id").eq("round_id", roundId),
      supabase.from("teams").select("id, name, team_code").eq("hackathon_id", hackathonId),
      supabase.from("judges").select("id, name, judge_code").eq("hackathon_id", hackathonId),
      supabase.from("criteria").select("id, name, max_score, weight").eq("round_id", roundId),
      supabase.from("round_judge_assignments").select("judge_id, team_id").eq("round_id", roundId),
      supabase.from("submissions").select("id, judge_id, team_id, feedback, submitted, score_details(criterion_id, value)").eq("round_id", roundId),
    ]);

  const teamIds = new Set((roundTeamRows || []).map((r) => r.team_id));
  const teams = (allTeams || []).filter((t) => teamIds.has(t.id));

  return (
    <div className="shell">
      <OrganizerTopbar email={userData.user.email} />
      <div className="page">
        <TerminalPath user="organizer" segments={["hackathons", hackathon?.name, round.name, "results"]} />
        <Link href={`/organizer/hackathons/${hackathonId}/rounds/${roundId}`} className="muted" style={{ fontSize: 13 }}>
          ← back to {round.name}
        </Link>
        <h1 className="title" style={{ margin: "12px 0 24px" }}>Results</h1>

        <ResultsView
          teams={teams}
          judges={judges || []}
          criteria={criteria || []}
          assignments={assignments || []}
          submissions={submissions || []}
        />
      </div>
    </div>
  );
}
