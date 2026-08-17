"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

function submissionTotal(sub, criteria) {
  return (sub.score_details || []).reduce((sum, s) => {
    const c = criteria.find(c => c.id === s.criterion_id);
    const w = c ? (Number(c.weight) || 1.0) : 1.0;
    return sum + (Number(s.value) * w);
  }, 0);
}

export default function ResultsView({ hackathonId, roundId, teams, judges, criteria, assignments, submissions }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState("overall");
  const [judgeFilter, setJudgeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTeam, setExpandedTeam] = useState(null);

  const maxTotal = useMemo(() => criteria.reduce((sum, c) => sum + (Number(c.max_score) * (Number(c.weight) || 1.0)), 0), [criteria]);

  const subByJudgeTeam = useMemo(() => {
    const map = {};
    submissions.forEach((s) => {
      map[`${s.judge_id}:${s.team_id}`] = s;
    });
    return map;
  }, [submissions]);

  // ── Judge view rows: one row per (judge, assigned team) ──
  const judgeRows = useMemo(() => {
    return assignments
      .map((a) => {
        const judge = judges.find((j) => j.id === a.judge_id);
        const team = teams.find((t) => t.id === a.team_id);
        const sub = subByJudgeTeam[`${a.judge_id}:${a.team_id}`];
        return {
          judgeId: a.judge_id,
          judgeName: judge?.name || judge?.judge_code || "—",
          teamId: a.team_id,
          teamName: team?.name || "—",
          teamIdDisplay: team?.team_code || null,
          submitted: !!sub?.submitted,
          total: sub ? submissionTotal(sub, criteria) : null,
          feedback: sub?.feedback || "",
        };
      })
      .filter((r) => (judgeFilter === "all" ? true : r.judgeId === judgeFilter))
      .filter((r) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "submitted") return r.submitted;
        return !r.submitted;
      });
  }, [assignments, judges, teams, subByJudgeTeam, judgeFilter, statusFilter, criteria]);

  // ── Overall leaderboard: aggregate submitted scores per team ──
  const leaderboard = useMemo(() => {
    return teams
      .map((t) => {
        const teamSubs = submissions.filter((s) => s.submitted && s.team_id === t.id);
        const judgeCount = teamSubs.length;
        
        // Calculate average per criterion
        const criterionAverages = criteria.map(c => {
          let sum = 0;
          let count = 0;
          const judgeScores = [];
          const w = Number(c.weight) || 1.0;
          
          teamSubs.forEach(sub => {
            const detail = sub.score_details?.find(d => d.criterion_id === c.id);
            const val = detail ? Number(detail.value) : 0;
            const judgeName = judges.find(j => j.id === sub.judge_id)?.name || "Unknown";
            judgeScores.push({ judgeName, score: val });
            sum += val;
            count++;
          });
          
          const rawAverage = count ? sum / count : 0;
          const weightedAverage = rawAverage * w;

          return {
            criterionId: c.id,
            name: c.name,
            maxScore: c.max_score,
            weight: w,
            rawAverage,
            average: weightedAverage,
            judgeScores
          };
        });
        
        const finalScore = judgeCount ? criterionAverages.reduce((acc, curr) => acc + curr.average, 0) : null;
        
        return { teamId: t.id, teamName: t.name, teamIdDisplay: t.team_code || null, judgeCount, finalScore, criterionAverages };
      })
      .sort((a, b) => (b.finalScore ?? -1) - (a.finalScore ?? -1));
  }, [teams, submissions, criteria, judges]);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleExportCSV = () => {
    if (!leaderboard.length) return;
    
    // Create header row
    const headers = ['Rank', 'Team Name', 'Team ID', 'Judges Count'];
    criteria.forEach(c => headers.push(`${c.name} (Avg)`));
    headers.push('Final Score');
    
    // Create data rows
    const rows = leaderboard.map((row, i) => {
      const data = [
        i + 1,
        `"${row.teamName.replace(/"/g, '""')}"`,
        row.teamIdDisplay || '',
        row.judgeCount
      ];
      
      row.criterionAverages.forEach(c => {
        data.push(c.average.toFixed(2));
      });
      
      data.push(row.finalScore !== null ? row.finalScore.toFixed(2) : '');
      return data.join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Round_Results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: 12 }}>
        <div className="tabs" style={{ borderBottom: "none", margin: 0 }}>
          <button className={`tab ${tab === "overall" ? "active" : ""}`} onClick={() => setTab("overall")}>
            overall leaderboard
          </button>
          <button className={`tab ${tab === "judges" ? "active" : ""}`} onClick={() => setTab("judges")}>
            judge view
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleExportCSV}
            disabled={leaderboard.length === 0}
          >
            Export CSV
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => window.open(`/public/hackathons/${hackathonId}/rounds/${roundId}/leaderboard`, '_blank')}
          >
            Open Public Display
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleRefresh} 
            disabled={isPending}
            style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
          >
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            {isPending ? "Refreshing..." : "Refresh Results"}
          </button>
        </div>
      </div>

      {tab === "overall" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!leaderboard.length && <div className="empty">No teams in this round yet.</div>}
          {leaderboard.map((row, i) => {
            const isExpanded = expandedTeam === row.teamId;
            return (
              <div key={row.teamId} className="card" style={{ padding: "1rem", borderColor: isExpanded ? "var(--accent-primary)" : "var(--border-subtle)" }}>
                <div 
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setExpandedTeam(isExpanded ? null : row.teamId)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span className="rank" style={{ fontSize: "1.25rem" }}>#{i + 1}</span>
                    <div style={{ fontWeight: 600, fontSize: "1.125rem", color: "#FFF" }}>{row.teamName}</div>
                    {row.teamIdDisplay && <span className="badge badge-active">ID: {row.teamIdDisplay}</span>}
                    <div className="muted" style={{ fontSize: 13 }}>{row.judgeCount} {row.judgeCount === 1 ? "judge" : "judges"} scored</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="score-big">
                      {row.finalScore === null ? "—" : `${row.finalScore.toFixed(1)} / ${maxTotal}`}
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="muted" /> : <ChevronDown size={20} className="muted" />}
                  </div>
                </div>

                {isExpanded && row.finalScore !== null && (
                  <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px dashed var(--border-subtle)" }}>
                    <h4 className="eyebrow" style={{ marginBottom: 12 }}>Category Breakdown (Averages)</h4>
                    <div style={{ display: "grid", gap: 12 }}>
                      {row.criterionAverages.map(c => (
                        <div key={c.criterionId} style={{ background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: c.judgeScores.length > 1 ? 8 : 0 }}>
                            <span style={{ fontWeight: 500 }}>{c.name} {c.weight !== 1 && <span className="muted text-sm">(×{c.weight})</span>}</span>
                            <span className="mono" style={{ color: "var(--accent-primary)" }}>{c.average.toFixed(1)} / {c.maxScore * c.weight}</span>
                          </div>
                          {c.judgeScores.length > 1 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 8, fontSize: 13 }}>
                              {c.judgeScores.map((js, idx) => (
                                <div key={idx} className="muted mono">
                                  {js.judgeName}: <span style={{ color: "var(--text-primary)" }}>{js.score}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isExpanded && row.finalScore === null && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed var(--border-subtle)", color: "var(--text-secondary)" }}>
                    Pending evaluation.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "judges" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <select className="input" style={{ width: 200 }} value={judgeFilter} onChange={(e) => setJudgeFilter(e.target.value)}>
              <option value="all">All judges</option>
              {judges.map((j) => (
                <option key={j.id} value={j.id}>{j.name || j.judge_code}</option>
              ))}
            </select>
            <select className="input" style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Judge</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {judgeRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.judgeName}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {r.teamName}
                        {r.teamIdDisplay && <span className="badge badge-active">ID: {r.teamIdDisplay}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${r.submitted ? "badge-active" : "badge-warn"}`}>
                        {r.submitted ? "submitted" : "pending"}
                      </span>
                    </td>
                    <td className="mono">{r.total === null ? "—" : `${r.total} / ${maxTotal}`}</td>
                    <td className="muted" style={{ maxWidth: 280 }}>{r.feedback}</td>
                  </tr>
                ))}
                {!judgeRows.length && (
                  <tr>
                    <td colSpan={5} className="empty">No matching rows.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
