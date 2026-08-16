"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setRoundTeams, autoAdvanceTopN } from "@/app/organizer/hackathons/actions";
import SubmitButton from "@/components/SubmitButton";

export default function TeamSelectionPanel({ hackathonId, roundId, allTeams, selectedTeamIds, previousRoundId }) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(selectedTeamIds));
  const [status, setStatus] = useState(null);
  const [topN, setTopN] = useState(15);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTeams = allTeams?.filter((t) => {
    const term = search.toLowerCase();
    return t.name.toLowerCase().includes(term) || (t.team_code && t.team_code.toLowerCase().includes(term));
  }) || [];

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    const res = await setRoundTeams(hackathonId, roundId, Array.from(selected));
    setBusy(false);
    setStatus(res.error ? { error: res.error } : { success: "Saved." });
    if (!res.error) router.refresh();
  }

  async function handleAutoAdvance() {
    if (!previousRoundId) return;
    setBusy(true);
    const res = await autoAdvanceTopN(hackathonId, roundId, previousRoundId, Number(topN));
    setBusy(false);
    if (res.error) {
      setStatus({ error: res.error });
    } else {
      setStatus({ success: `Advanced top ${topN}.` });
      router.refresh();
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 className="subtitle" style={{ margin: 0 }}>Teams in this round</h2>
        <span className="badge badge-active">{selected.size} / {allTeams?.length || 0} selected</span>
      </div>

      {previousRoundId && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <span className="muted" style={{ fontSize: 13 }}>Auto-advance top</span>
          <input
            className="input mono"
            style={{ width: 70 }}
            type="number"
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
          />
          <span className="muted" style={{ fontSize: 13 }}>from the previous round</span>
          <button className="btn btn-secondary btn-sm" onClick={handleAutoAdvance} disabled={busy}>
            Advance
          </button>
        </div>
      )}

      {status?.error && <div className="alert alert-error">{status.error}</div>}
      {status?.success && <div className="alert alert-success">{status.success}</div>}

      {!allTeams?.length && <div className="empty">No teams in this hackathon yet.</div>}

      {allTeams?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Search teams by name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set(allTeams.map(t => t.id)))}>Select All</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
          
          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 8px" }}>
            {filteredTeams.map((t) => (
              <label key={t.id} className="list-item" style={{ cursor: "pointer", padding: "8px 4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {t.name} {t.team_code && <span className="badge">ID: {t.team_code}</span>}
                </span>
                <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
              </label>
            ))}
            {filteredTeams.length === 0 && <div className="muted text-center" style={{ padding: "16px 0" }}>No teams match your search.</div>}
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save team list"}
      </button>
    </div>
  );
}
