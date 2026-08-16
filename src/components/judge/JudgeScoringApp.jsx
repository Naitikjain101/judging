"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { submitScore } from "@/app/judge/actions";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JudgeScoringApp({ roundsData }) {
  const router = useRouter();
  
  // Auto-refresh assignments every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const activeRounds = roundsData.filter((r) => r.round.status !== "completed");
  const list = activeRounds.length ? activeRounds : roundsData;

  // Smart Routing: Find earliest round with unfinished teams
  const initialRoundIndex = useMemo(() => {
    if (!list.length) return 0;
    const idx = list.findIndex(r => {
      return r.teams.some(t => {
        const sub = r.submissions.find(s => s.team_id === t.id);
        return !sub?.submitted;
      });
    });
    return idx !== -1 ? idx : 0;
  }, [list]);

  const [roundIndex, setRoundIndex] = useState(initialRoundIndex);
  
  // Determine initial team id for the selected round
  const initialTeamId = useMemo(() => {
    if (!list[roundIndex]?.teams?.length) return "";
    const firstUnfinished = list[roundIndex].teams.find(t => {
      const sub = list[roundIndex].submissions.find(s => s.team_id === t.id);
      return !sub?.submitted;
    });
    return firstUnfinished ? firstUnfinished.id : list[roundIndex].teams[0].id;
  }, [list, roundIndex]);

  const [teamId, setTeamId] = useState(initialTeamId);

  // Sync teamId if round changes
  useEffect(() => {
    if (list[roundIndex]?.teams?.length && !list[roundIndex].teams.find(t => t.id === teamId)) {
      setTeamId(list[roundIndex].teams[0].id);
    }
  }, [roundIndex, list, teamId]);

  const current = list[roundIndex];

  if (!list.length) {
    return <div className="empty">You don't have any teams assigned yet. Check back once your organizer sets up assignments.</div>;
  }

  function handleRoundChange(index) {
    setRoundIndex(index);
  }

  function handleNextTeam() {
    const currentIndex = current.teams.findIndex(t => t.id === teamId);
    if (currentIndex < current.teams.length - 1) {
      setTeamId(current.teams[currentIndex + 1].id);
    }
  }

  function handlePrevTeam() {
    const currentIndex = current.teams.findIndex(t => t.id === teamId);
    if (currentIndex > 0) {
      setTeamId(current.teams[currentIndex - 1].id);
    }
  }

  const selectedTeam = current.teams.find((t) => t.id === teamId);
  const existingSubmission = current.submissions.find((s) => s.team_id === teamId);
  const currentIndex = current.teams.findIndex(t => t.id === teamId);

  return (
    <div>
      {list.length > 1 && (
        <div className="field" style={{ maxWidth: 320, marginBottom: 24 }}>
          <label htmlFor="round-select">Round</label>
          <select
            id="round-select"
            className="input"
            value={roundIndex}
            onChange={(e) => handleRoundChange(Number(e.target.value))}
          >
            {list.map((r, i) => (
              <option key={r.round.id} value={i}>
                {r.round.name} ({r.round.status})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="scoring-layout">
        <div className="scoring-sidebar">
          <h3 className="eyebrow" style={{ padding: "0 4px" }}>Teams ({current.teams.length})</h3>
          {!current.teams.length && <div className="muted" style={{ fontSize: 13, padding: "0 4px" }}>No teams assigned</div>}
          {current.teams.map((t) => {
            const sub = current.submissions.find((s) => s.team_id === t.id);
            const isDone = sub?.submitted;
            const isActive = t.id === teamId;
            return (
              <button 
                key={t.id} 
                className={`team-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => setTeamId(t.id)}
              >
                <span>{t.name} {t.team_code ? `(ID: ${t.team_code})` : ""}</span>
                {isDone && <span className="status-dot done" title="Evaluated"></span>}
              </button>
            );
          })}
        </div>

        <div className="scoring-main" style={{ position: "relative" }}>
          {selectedTeam ? (
            <ScoreForm
              key={`${current.round.id}-${teamId}`}
              roundId={current.round.id}
              team={selectedTeam}
              criteria={current.criteria}
              existingSubmission={existingSubmission}
              onNext={currentIndex < current.teams.length - 1 ? handleNextTeam : null}
              onPrev={currentIndex > 0 ? handlePrevTeam : null}
            />
          ) : (
            <div className="empty">Select a team to score</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreForm({ roundId, team, criteria, existingSubmission, onNext, onPrev }) {
  const initialScores = useMemo(() => {
    const map = {};
    criteria.forEach((c) => {
      const existing = existingSubmission?.score_details?.find((s) => s.criterion_id === c.id);
      map[c.id] = existing ? existing.value : "";
    });
    return map;
  }, [criteria, existingSubmission]);

  const [scores, setScores] = useState(initialScores);
  const [feedback, setFeedback] = useState(existingSubmission?.feedback || "");
  const [busy, setBusy] = useState(false);

  const total = criteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0);
  const maxTotal = criteria.reduce((sum, c) => sum + Number(c.max_score), 0);

  const handleSubmit = useCallback(async (e, goNext = false) => {
    if (e && e.preventDefault) e.preventDefault();
    setBusy(true);
    
    const promise = submitScore({ roundId, teamId: team.id, feedback, scores });
    
    toast.promise(promise, {
      loading: 'Saving scores...',
      success: (res) => {
        if (res.error) throw new Error(res.error);
        if (goNext && onNext) onNext();
        return existingSubmission?.submitted ? "Scores updated successfully!" : "Scores submitted successfully!";
      },
      error: (err) => err.message || 'Failed to save scores'
    });

    try {
      await promise;
    } finally {
      setBusy(false);
    }
  }, [roundId, team.id, feedback, scores, onNext, existingSubmission]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      
      if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(null, false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, handleSubmit]);

  if (!criteria.length) {
    return <div className="empty">This round has no judging criteria yet — ask your organizer to add some.</div>;
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="card animate-in" style={{ paddingBottom: 80, minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <h2 className="title" style={{ fontSize: 24, margin: 0 }}>{team.name}</h2>
            {team.team_code && (
              <span className="badge badge-active" style={{ fontSize: 13 }}>ID: {team.team_code}</span>
            )}
          </div>
          {team.members && <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>{team.members}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {existingSubmission?.submitted && <span className="badge badge-active">submitted</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        {criteria.map((c) => {
          const maxVal = Math.floor(Number(c.max_score));
          const bubbleOptions = Array.from({ length: maxVal + 1 }, (_, i) => i);
          
          return (
            <div key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label className="eyebrow" style={{ margin: 0, fontSize: 13 }}>{c.name}</label>
                <span className="mono muted" style={{ fontSize: 14, color: "var(--accent-primary)" }}>
                  {scores[c.id] !== "" ? scores[c.id] : "-"} / {c.max_score}
                </span>
              </div>
              
              <div className="bubbles" style={{ gap: "8px" }}>
                {bubbleOptions.map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`bubble-btn ${Number(scores[c.id]) === val && scores[c.id] !== "" ? 'active' : ''}`}
                    onClick={() => setScores((prev) => ({ ...prev, [c.id]: val }))}
                    style={{ width: "3.5rem", height: "3.5rem", fontSize: "1.125rem" }} // Larger targets
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="field">
        <label htmlFor="feedback" className="eyebrow" style={{ fontSize: 13 }}>Feedback (Optional)</label>
        <textarea
          id="feedback"
          className="textarea"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What stood out, what could improve…"
          style={{ minHeight: 140, fontSize: 16 }}
        />
      </div>

      <div className="sticky-action-bar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className="score-big" style={{ fontSize: "1.5rem" }}>{total} / {maxTotal}</span>
          </div>
          
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onPrev} disabled={!onPrev || busy}>
              <ChevronLeft size={20} /> <span className="hide-mobile">Prev</span>
            </button>
            <button type="button" className="btn btn-secondary hide-mobile" onClick={(e) => handleSubmit(e, false)} disabled={busy} title="Cmd+S to save">
              <Save size={18} /> {busy ? "Saving…" : "Save"}
            </button>
            
            <button 
              type="button" 
              className="btn btn-accent" 
              onClick={(e) => handleSubmit(e, true)} 
              disabled={busy}
              style={{ minWidth: 120, borderRadius: 100 }}
            >
              {busy ? "Saving…" : (onNext ? "Save & Next" : "Save (Done)")} {onNext && <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
