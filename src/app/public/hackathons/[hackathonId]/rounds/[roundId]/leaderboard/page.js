import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LiveLeaderboard from "@/components/public/LiveLeaderboard";

export default async function PublicLeaderboardPage({ params }) {
  const { hackathonId, roundId } = await params;
  const supabase = await createClient();

  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single();
  if (!round) notFound();

  const { data: hackathon } = await supabase.from("hackathons").select("id, name").eq("id", hackathonId).single();

  const [{ data: roundTeamRows }, { data: allTeams }, { data: criteria }, { data: submissions }] =
    await Promise.all([
      supabase.from("round_teams").select("team_id").eq("round_id", roundId),
      supabase.from("teams").select("id, name, team_code").eq("hackathon_id", hackathonId),
      supabase.from("criteria").select("id, name, max_score, weight").eq("round_id", roundId),
      supabase.from("submissions").select("id, judge_id, team_id, submitted, score_details(criterion_id, value)").eq("round_id", roundId),
    ]);

  const teamIds = new Set((roundTeamRows || []).map((r) => r.team_id));
  const teams = (allTeams || []).filter((t) => teamIds.has(t.id));

  // Compute leaderboard
  const maxTotal = criteria.reduce((sum, c) => sum + (Number(c.max_score) * (Number(c.weight) || 1.0)), 0);

  const leaderboard = teams
    .map((t) => {
      const teamSubs = (submissions || []).filter((s) => s.submitted && s.team_id === t.id);
      const judgeCount = teamSubs.length;
      
      const criterionAverages = (criteria || []).map(c => {
        let sum = 0;
        let count = 0;
        const w = Number(c.weight) || 1.0;
        
        teamSubs.forEach(sub => {
          const detail = sub.score_details?.find(d => d.criterion_id === c.id);
          const val = detail ? Number(detail.value) : 0;
          sum += val;
          count++;
        });
        
        const rawAverage = count ? sum / count : 0;
        const weightedAverage = rawAverage * w;

        return { average: weightedAverage };
      });
      
      const finalScore = judgeCount ? criterionAverages.reduce((acc, curr) => acc + curr.average, 0) : null;
      
      return { teamId: t.id, teamName: t.name, teamIdDisplay: t.team_code || null, finalScore };
    })
    .filter(t => t.finalScore !== null)
    .sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div className="shell" style={{ minHeight: '100vh', background: 'var(--bg-default)' }}>
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="title" style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            {hackathon?.name}
          </h1>
          <h2 className="subtitle" style={{ fontSize: '1.5rem', margin: 0 }}>{round.name} - Live Leaderboard</h2>
        </div>

        <LiveLeaderboard leaderboard={leaderboard} maxTotal={maxTotal} />
      </div>
    </div>
  );
}
