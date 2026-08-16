"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importJudgesCSV } from "@/app/organizer/hackathons/actions";

// Expects a CSV with headers: Judge Name, Company, Designation, Judge ID, Password
export default function CsvImportJudges({ hackathonId }) {
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
        // Map headers to what we need. Allow some flexibility in header names.
        const rows = results.data.map((r) => {
          // Find matching keys case-insensitively or by spaces
          const getVal = (keyStr) => {
            const key = Object.keys(r).find(k => k.toLowerCase().replace(/ /g, '') === keyStr.toLowerCase().replace(/ /g, ''));
            return r[key]?.trim();
          };

          return {
            name: getVal("JudgeName") || getVal("Name"),
            company: getVal("Company"),
            designation: getVal("Designation"),
            judgeCode: getVal("JudgeID"),
            password: getVal("Password"),
          };
        }).filter(r => r.name || r.judgeCode);

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
    const res = await importJudgesCSV(hackathonId, previewRows);
    setBusy(false);
    
    if (res.error) {
      setStatus({ error: res.error });
      if (res.count) {
        setStatus({ success: `Imported ${res.count} judges with some errors. See below.` });
      }
    } else {
      setStatus({ success: `Successfully imported ${res.count} judges.` });
      setPreviewRows(null);
    }
  }

  function downloadSample() {
    const sample = "Judge Name,Company,Designation,Judge ID,Password\nJane Doe,Acme Corp,Senior Engineer,J-001,secret123\nJohn Smith,,Designer,J-002,pass4567\n";
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'judges_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
          {busy ? "Parsing…" : "Import CSV"}
          <input type="file" accept=".csv" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
        </label>
        <button className="btn btn-secondary btn-sm" onClick={downloadSample}>
          Download Sample
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
        Headers: Judge Name, Company, Designation, Judge ID, Password
      </p>

      {status?.error && <div className="alert alert-error" style={{ marginTop: 8 }}>{status.error}</div>}
      {status?.success && <div className="alert alert-success" style={{ marginTop: 8 }}>{status.success}</div>}

      {previewRows && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Preview ({previewRows.length} Judges)</h3>
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Designation</th>
                  <th>Judge ID</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name || <span className="muted">Missing</span>}</td>
                    <td>{r.company || "-"}</td>
                    <td>{r.designation || "-"}</td>
                    <td>{r.judgeCode || <span className="muted">Missing</span>}</td>
                    <td className="mono muted">{r.password || <span className="muted">Missing</span>}</td>
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
