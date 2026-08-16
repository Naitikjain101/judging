"use client";

import { useState, useTransition } from "react";
import { setJudgeAssignments, bulkAssignJudges } from "@/app/organizer/hackathons/actions";
import { Users, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";

function JudgeRow({ hackathonId, roundId, judge, roundTeams, initialTeamIds }) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(initialTeamIds));
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);
  
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  function saveSelection(nextSet) {
    setSelected(nextSet);
    setJustSaved(false);
    startTransition(async () => {
      await setJudgeAssignments(hackathonId, roundId, judge.id, Array.from(nextSet));
      setJustSaved(true);
      router.refresh();
    });
  }

  function toggle(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    saveSelection(next);
  }

  function assignAll() {
    saveSelection(new Set(roundTeams.map(t => t.id)));
  }

  function clearAll() {
    saveSelection(new Set());
  }

  function handleBulkPaste() {
    if (!bulkInput.trim()) return;
    const ids = bulkInput.split(/[\s,]+/).filter(Boolean).map(s => s.toLowerCase());
    const next = new Set(selected);
    let added = 0;
    
    roundTeams.forEach(t => {
      if (t.team_code && ids.includes(t.team_code.toLowerCase())) {
        next.add(t.id);
        added++;
      }
    });
    
    if (added > 0) saveSelection(next);
    setBulkInput("");
  }

  function handleRangeAssign() {
    if (!rangeStart.trim() || !rangeEnd.trim()) return;
    const start = rangeStart.toLowerCase();
    const end = rangeEnd.toLowerCase();
    
    const sortedTeams = [...roundTeams].sort((a, b) => (a.team_code || "").localeCompare(b.team_code || ""));
    
    let inRange = false;
    const next = new Set(selected);
    let added = 0;
    
    sortedTeams.forEach(t => {
      if (!t.team_code) return;
      const code = t.team_code.toLowerCase();
      if (code === start) inRange = true;
      
      if (inRange) {
        next.add(t.id);
        added++;
      }
      
      if (code === end) inRange = false;
    });
    
    if (added > 0) saveSelection(next);
    setRangeStart("");
    setRangeEnd("");
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{judge.name || judge.judge_code}</div>
          <div className="mono muted" style={{ fontSize: 12 }}>{judge.judge_code}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="muted" style={{ fontSize: 12 }}>
            {isPending ? "Saving…" : justSaved ? "Saved ✓" : ""}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setAdvancedOpen(!advancedOpen)}>
            {advancedOpen ? "Hide Advanced" : "Advanced Assign"}
          </button>
        </div>
      </div>

      {advancedOpen && (
        <div style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: "var(--radius-sm)", marginBottom: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
              <label>Paste Team IDs (comma/space separated)</label>
              <textarea 
                className="textarea" 
                style={{ minHeight: 60 }} 
                value={bulkInput} 
                onChange={(e) => setBulkInput(e.target.value)} 
                placeholder="T001, T002, T005..."
              />
            </div>
            <button className="btn btn-primary btn-sm" style={{ height: 44 }} onClick={handleBulkPaste} disabled={isPending}>Paste & Assign</button>
          </div>
          
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 100 }}>
              <label>From Team ID</label>
              <input className="input" value={rangeStart} onChange={e => setRangeStart(e.target.value)} placeholder="T001" />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 100 }}>
              <label>To Team ID</label>
              <input className="input" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} placeholder="T010" />
            </div>
            <button className="btn btn-primary btn-sm" style={{ height: 44 }} onClick={handleRangeAssign} disabled={isPending}>Assign Range</button>
          </div>
          
          <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={assignAll} disabled={isPending}>Assign All Teams</button>
            <button className="btn btn-danger btn-sm" onClick={clearAll} disabled={isPending}>Clear All</button>
          </div>
          
        </div>
      )}

      {!roundTeams?.length && <p className="muted" style={{ fontSize: 13 }}>Add teams to this round first.</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {roundTeams?.map((t) => {
          const active = selected.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`badge ${active ? "badge-active" : ""}`}
              style={{ cursor: "pointer", background: active ? undefined : "transparent" }}
            >
              {t.name} {t.team_code ? `(ID: ${t.team_code})` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}



export default function JudgeAssignmentPanel({ hackathonId, roundId, judges, roundTeams, assignments }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleBulkAssign = (strategy) => {
    if (!judges.length || !roundTeams.length) {
      alert("Need at least 1 judge and 1 team.");
      return;
    }
    
    const confirmMsg = strategy === "all" ? 
      "Assign EVERY team to EVERY judge?" : 
      "Distribute teams evenly among judges using Round Robin?";
      
    if (!confirm(confirmMsg)) return;
    
    startTransition(async () => {
      const jIds = judges.map(j => j.id);
      const tIds = roundTeams.map(t => t.id);
      await bulkAssignJudges(hackathonId, roundId, jIds, tIds, strategy);
      router.refresh();
    });
  };

  const handleClearAll = () => {
    if (!confirm("Clear ALL assignments for this round?")) return;
    startTransition(async () => {
      await bulkAssignJudges(hackathonId, roundId, [], [], "all");
      router.refresh();
    });
  };

  return (
    <div>
      <h2 className="subtitle">Global Assignment Engine</h2>
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-accent" onClick={() => handleBulkAssign('all')} disabled={isPending}>
          <Users size={16} /> Equal Distribution (All-to-All)
        </button>
        <button className="btn btn-primary" onClick={() => handleBulkAssign('round_robin')} disabled={isPending}>
          <Shuffle size={16} /> Round Robin (Equal Load)
        </button>
        <button className="btn btn-danger" onClick={handleClearAll} disabled={isPending}>
          Reset All
        </button>
      </div>

      <h2 className="subtitle">Per-Judge Adjustments</h2>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Tap a team to toggle it for that judge — saves automatically. Use Advanced Assign for bulk operations.
      </p>
      {!judges?.length && <div className="empty">No judges added to this hackathon yet.</div>}
      {judges?.map((j) => {
        const initialTeamIds = assignments.filter((a) => a.judge_id === j.id).map((a) => a.team_id);
        return (
          <JudgeRow
            key={j.id}
            hackathonId={hackathonId}
            roundId={roundId}
            judge={j}
            roundTeams={roundTeams}
            initialTeamIds={initialTeamIds}
          />
        );
      })}
    </div>
  );
}
