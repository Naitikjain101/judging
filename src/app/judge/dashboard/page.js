import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JudgeTopbar from "@/components/JudgeTopbar";
import TerminalPath from "@/components/TerminalPath";
import JudgeScoringApp from "@/components/judge/JudgeScoringApp";

export default async function JudgeDashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/judge/login");

  const { data: judge } = await supabase
    .from("judges")
    .select("id, name, judge_code, hackathon_id, company")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (!judge) redirect("/judge/login");

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("name")
    .eq("id", judge.hackathon_id)
    .single();

  const { data: assignmentRows } = await supabase
    .from("round_judge_assignments")
    .select("round_id, team_id")
    .eq("judge_id", judge.id);

  const roundIds = [...new Set((assignmentRows || []).map((a) => a.round_id))];

  let roundsData = [];
  if (roundIds.length) {
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id, name, status, order_index")
      .in("id", roundIds)
      .order("order_index");

    // Extract all unique team IDs assigned to this judge
    const allAssignedTeamIds = [...new Set(assignmentRows.map(a => a.team_id))];

    // Batch fetch ALL necessary data in 3 parallel queries instead of 3 queries PER round
    const [{ data: allTeams }, { data: allCriteria }, { data: allSubmissions }] = await Promise.all([
      supabase.from("teams").select("id, name, members, team_code, hackathon_id").in("id", allAssignedTeamIds),
      supabase.from("criteria").select("id, name, max_score, round_id").in("round_id", roundIds).order("order_index"),
      supabase
        .from("submissions")
        .select("team_id, feedback, submitted, round_id, score_details(criterion_id, value)")
        .in("round_id", roundIds)
        .eq("judge_id", judge.id),
    ]);

    // Group the global data by round
    roundsData = (rounds || []).map((round) => {
      const teamIdsForRound = assignmentRows.filter((a) => a.round_id === round.id).map((a) => a.team_id);
      
      return { 
        round, 
        teams: (allTeams || []).filter(t => teamIdsForRound.includes(t.id)), 
        criteria: (allCriteria || []).filter(c => c.round_id === round.id), 
        submissions: (allSubmissions || []).filter(s => s.round_id === round.id)
      };
    });
  }

  return (
    <div className="shell">
      <JudgeTopbar judgeName={judge.name || judge.judge_code} company={judge.company} />
      <div className="page">
        <TerminalPath user={judge.judge_code} segments={[hackathon?.name || "hackathon", "scoring"]} />
        <h1 className="title" style={{ marginBottom: 24 }}>
          Score your teams
        </h1>

        <JudgeScoringApp roundsData={roundsData} />
      </div>
    </div>
  );
}
