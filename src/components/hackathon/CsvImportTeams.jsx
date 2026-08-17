"use client";

import { useState } from "react";
import Papa from "papaparse";
import { importTeamsCSV } from "@/app/organizer/hackathons/actions";
import { UploadCloud, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

export default function CsvImportTeams({ hackathonId }) {
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Preview/Fix, 3 = Confirm/Importing
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setBusy(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((r) => {
          const getVal = (keyStr) => {
            const key = Object.keys(r).find(k => k.toLowerCase().replace(/ /g, '') === keyStr.toLowerCase().replace(/ /g, ''));
            return r[key]?.trim();
          };
          
          const teamCode = getVal("teamid") || getVal("teamcode") || "";
          const leaderName = getVal("leader") || getVal("leadername") || "";
          const leaderEmail = getVal("email") || getVal("leaderemail") || "";
          const leaderPhone = getVal("phone") || getVal("leaderphone") || "";
          
          let foodRaw = getVal("food");
          const foodPurchased = foodRaw?.toLowerCase() === "yes" || foodRaw?.toLowerCase() === "included";
          
          let paymentRaw = getVal("payment") || getVal("paymentstatus");
          let foodPaymentStatus = "Unpaid";
          if (paymentRaw?.toLowerCase() === "paid") foodPaymentStatus = "Paid";
          if (paymentRaw?.toLowerCase() === "pending") foodPaymentStatus = "Pending";
          if (foodPurchased && !paymentRaw) foodPaymentStatus = "Pending";

          let rawMembers = getVal("members");
          let parsedMembers = [];
          if (rawMembers) {
            try {
              if (rawMembers.startsWith("[")) {
                parsedMembers = JSON.parse(rawMembers);
              } else {
                parsedMembers = rawMembers.split(",").map(m => ({ name: m.trim(), status: 'Pending' }));
              }
            } catch (e) {
              parsedMembers = rawMembers.split(",").map(m => ({ name: m.trim(), status: 'Pending' }));
            }
          }
          
          const foodQuantity = parseInt(getVal("foodquantity"), 10) || (parsedMembers.length > 0 ? parsedMembers.length : 1);

          return {
            name: getVal("name") || "",
            members: JSON.stringify(parsedMembers),
            teamCode,
            leaderName,
            leaderEmail,
            leaderPhone,
            foodPurchased,
            foodPaymentStatus,
            foodQuantity,
            _membersCount: parsedMembers.length
          };
        });
        
        if (rows.length === 0) {
          setStatus({ error: "No valid rows found in CSV." });
          setBusy(false);
          return;
        }

        setPreviewRows(rows);
        setStep(2);
        setBusy(false);
      },
      error: (err) => {
        setStatus({ error: err.message });
        setBusy(false);
      },
    });
    e.target.value = "";
  }

  const updateRow = (index, field, value) => {
    const newRows = [...previewRows];
    newRows[index][field] = value;
    setPreviewRows(newRows);
  };

  const getErrors = (r) => {
    const errs = [];
    if (!r.name) errs.push("Missing Team Name");
    if (!r.teamCode) errs.push("Missing Team ID");
    if (!r.leaderName) errs.push("Missing Leader Name");
    if (!r.leaderEmail) errs.push("Missing Leader Email");
    return errs;
  };

  async function handleConfirm() {
    setStep(3);
    setBusy(true);
    setStatus(null);
    
    // Only import valid rows
    const validRows = previewRows.filter(r => getErrors(r).length === 0);
    
    if (validRows.length === 0) {
      setStatus({ error: "No valid rows to import. Please fix errors first." });
      setStep(2);
      setBusy(false);
      return;
    }

    const res = await importTeamsCSV(hackathonId, validRows);
    setBusy(false);
    
    if (res.error) {
      setStatus({ error: res.error });
      if (res.count) {
        setStatus({ success: `Imported ${res.count} teams with some errors.` });
      }
      setStep(1);
    } else {
      setStatus({ success: `✅ Successfully imported ${res.count} teams.` });
      setPreviewRows([]);
      setStep(1);
    }
  }

  const validCount = previewRows.filter(r => getErrors(r).length === 0).length;
  const errorCount = previewRows.length - validCount;
  
  const totalFoodIncluded = previewRows.filter(r => r.foodPurchased).length;
  const totalFoodPaid = previewRows.filter(r => r.foodPurchased && r.foodPaymentStatus === 'Paid').length;
  const totalFoodPending = previewRows.filter(r => r.foodPurchased && r.foodPaymentStatus === 'Pending').length;

  if (step === 1) {
    return (
      <div style={{ display: 'inline-block' }}>
        <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
          <UploadCloud size={16} /> {busy ? "Parsing…" : "Import CSV"}
          <input type="file" accept=".csv" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
        </label>
        {status?.error && <div className="alert alert-error" style={{ marginTop: 8 }}>{status.error}</div>}
        {status?.success && <div className="alert alert-success" style={{ marginTop: 8 }}>{status.success}</div>}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '2rem'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        position: 'relative', padding: 0, overflow: 'hidden'
      }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="title" style={{ fontSize: '1.25rem', margin: 0 }}>Review Import Data</h2>
            <p className="muted" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
              {previewRows.length} total teams &mdash; {validCount} ready, {errorCount} need attention
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={busy || validCount === 0}>
              {busy ? "Importing…" : `Import ${validCount} Teams`}
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 0, background: 'var(--bg)' }}>
          <table className="data-table" style={{ borderTop: 'none', margin: 0 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ width: 40 }}>Status</th>
                <th>Team Name</th>
                <th style={{ width: 120 }}>Team ID</th>
                <th>Leader Name</th>
                <th>Leader Email</th>
                <th style={{ width: 100 }}>Food</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((r, i) => {
                const errs = getErrors(r);
                const hasError = errs.length > 0;
                return (
                  <tr key={i} style={{ background: hasError ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      {hasError ? <AlertTriangle size={18} color="#ef4444" title={errs.join(', ')}/> : <CheckCircle size={18} color="#10b981"/>}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px', height: 32, borderColor: !r.name ? '#ef4444' : 'var(--border-subtle)' }}
                        value={r.name} 
                        onChange={e => updateRow(i, 'name', e.target.value)} 
                        placeholder="Required"
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        className="input mono" 
                        style={{ padding: '4px 8px', height: 32, borderColor: !r.teamCode ? '#ef4444' : 'var(--border-subtle)', textTransform: 'uppercase' }}
                        value={r.teamCode} 
                        onChange={e => updateRow(i, 'teamCode', e.target.value)} 
                        placeholder="Required"
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px', height: 32, borderColor: !r.leaderName ? '#ef4444' : 'var(--border-subtle)' }}
                        value={r.leaderName} 
                        onChange={e => updateRow(i, 'leaderName', e.target.value)} 
                        placeholder="Required"
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px', height: 32, borderColor: !r.leaderEmail ? '#ef4444' : 'var(--border-subtle)' }}
                        value={r.leaderEmail} 
                        onChange={e => updateRow(i, 'leaderEmail', e.target.value)} 
                        placeholder="Required"
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select 
                        className="input" 
                        style={{ padding: '4px 8px', height: 32 }}
                        value={r.foodPurchased ? 'yes' : 'no'}
                        onChange={e => updateRow(i, 'foodPurchased', e.target.value === 'yes')}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ fontSize: 13 }}>
              <span className="muted">Food Included:</span> <strong style={{ marginLeft: 4 }}>{totalFoodIncluded}</strong>
            </div>
            <div style={{ fontSize: 13 }}>
              <span className="muted">Food Paid:</span> <strong style={{ marginLeft: 4 }}>{totalFoodPaid}</strong>
            </div>
            <div style={{ fontSize: 13 }}>
              <span className="muted">Food Pending:</span> <strong style={{ marginLeft: 4 }}>{totalFoodPending}</strong>
            </div>
          </div>
          {errorCount > 0 && (
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14}/> {errorCount} row(s) will be skipped
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
