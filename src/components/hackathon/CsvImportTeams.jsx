"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importTeamsCSV } from "@/app/organizer/hackathons/actions";

// Expects a CSV with headers: name, members, teamId
export default function CsvImportTeams({ hackathonId }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [previewRows, setPreviewRows] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((r) => {
          const getVal = (keyStr) => {
            const key = Object.keys(r).find(k => k.toLowerCase().replace(/ /g, '') === keyStr.toLowerCase().replace(/ /g, ''));
            return r[key]?.trim();
          };
          return {
            name: getVal("name"),
            members: getVal("members"),
            teamCode: getVal("teamid") || getVal("teamcode"),
          };
        }).filter(r => r.name || r.teamCode);
        
        if (rows.length === 0) {
          setStatus({ error: "No valid rows found in CSV." });
          return;
        }

        setPreviewRows(rows);
      },
      error: (err) => {
        setStatus({ error: err.message });
      },
    });
    e.target.value = "";
  }

  async function handleConfirm() {
    setBusy(true);
    setStatus(null);
    const res = await importTeamsCSV(hackathonId, previewRows);
    setBusy(false);
    
    if (res.error) {
      setStatus({ error: res.error });
      if (res.count) {
        setStatus({ success: `Imported ${res.count} teams with some errors.` });
      }
    } else {
      setStatus({ success: `Successfully imported ${res.count} teams.` });
      setPreviewRows(null);
    }
  }

  return (
    <div>
      <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
        {busy ? "Parsing…" : "Import CSV"}
        <input type="file" accept=".csv" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
      </label>
      <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
        Headers: name, members, teamId (use for Team ID / Table Number)
      </p>
      
      {status?.error && <div className="alert alert-error" style={{ marginTop: 8 }}>{status.error}</div>}
      {status?.success && <div className="alert alert-success" style={{ marginTop: 8 }}>{status.success}</div>}

      {previewRows && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Preview ({previewRows.length} Teams)</h3>
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Members</th>
                  <th>Team ID</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name || <span className="muted">Missing</span>}</td>
                    <td>{r.members || "-"}</td>
                    <td>{r.teamCode || <span className="muted">Missing</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleConfirm} disabled={busy}>
              {busy ? "Importing…" : "Confirm Import"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setPreviewRows(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
