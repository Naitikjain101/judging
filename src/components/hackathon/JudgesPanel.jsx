"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addJudge, deleteJudge, resetJudgePassword } from "@/app/organizer/hackathons/actions";
import SubmitButton from "@/components/SubmitButton";
import CsvImportJudges from "./CsvImportJudges";
import { Copy, Check } from "lucide-react";

function randomCode() {
  return "J-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function randomPassword() {
  return Math.random().toString(36).slice(2, 10);
}

export default function JudgesPanel({ hackathonId, judges }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [defaults, setDefaults] = useState({ code: randomCode(), password: randomPassword() });
  const [copiedId, setCopiedId] = useState(null);
  const [newlyCreated, setNewlyCreated] = useState(null);

  const [isResetting, setIsResetting] = useState(false);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetPassword = async (judge) => {
    if (!confirm(`Are you sure you want to reset the password for ${judge.name}?`)) return;
    setIsResetting(true);
    const res = await resetJudgePassword(hackathonId, judge.id, judge.auth_user_id);
    setIsResetting(false);
    
    if (res?.error) {
      alert(res.error);
    } else {
      setNewlyCreated({
        name: judge.name,
        code: judge.judge_code,
        password: res.newPassword,
        isReset: true
      });
      window.scrollTo(0, 0);
    }
  };

  async function handleAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await addJudge(hackathonId, formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setError(null);
      setNewlyCreated({
        name: formData.get("name"),
        code: formData.get("judgeCode"),
        password: formData.get("password")
      });
      e.target.reset();
      setDefaults({ code: randomCode(), password: randomPassword() });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <form id="add-judge-form" onSubmit={handleAdd} style={{ flex: 1, minWidth: 240 }}>
            {error && <div className="alert alert-error">{error}</div>}
          <div className="field">
            <label htmlFor="judge-name">Name</label>
            <input className="input" id="judge-name" name="name" required />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="judge-company">Company (Optional)</label>
              <input className="input" id="judge-company" name="company" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="judge-designation">Designation (Optional)</label>
              <input className="input" id="judge-designation" name="designation" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="judge-code">Judge ID</label>
              <input className="input mono" id="judge-code" name="judgeCode" defaultValue={defaults.code} required />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="judge-password">Password</label>
              <input className="input mono" id="judge-password" name="password" defaultValue={defaults.password} required />
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
            Auto-generated — edit if you&apos;d rather set your own. Share these with the judge.
          </p>
            <SubmitButton pendingText="Adding…">Add judge</SubmitButton>
          </form>
          <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CsvImportJudges hackathonId={hackathonId} />
            
            {newlyCreated && (
              <div style={{ padding: 16, background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 8 }}>
                <h4 style={{ color: 'var(--success)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={18} /> {newlyCreated.isReset ? "Password Reset Successfully" : "Judge Created Successfully"}
                </h4>
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="muted">Judge ID:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontWeight: 600 }}>{newlyCreated.code}</span>
                      <button onClick={() => handleCopy(newlyCreated.code, 'new-code')} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }}>
                        {copiedId === 'new-code' ? <Check size={12} /> : <Copy size={12} />} Copy
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="muted">Password:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontWeight: 600 }}>{newlyCreated.password}</span>
                      <button onClick={() => handleCopy(newlyCreated.password, 'new-pass')} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }}>
                        {copiedId === 'new-pass' ? <Check size={12} /> : <Copy size={12} />} Copy
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleCopy(`Judge ID: ${newlyCreated.code}\nPassword: ${newlyCreated.password}`, 'new-all')} 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}
                >
                  {copiedId === 'new-all' ? <Check size={16} /> : <Copy size={16} />} Copy Login Credentials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!judges?.length && <div className="empty">No judges yet.</div>}

      {judges?.map((j) => (
        <div key={j.id} className="list-item" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              {j.name || "Unnamed judge"}
              {j.company && <span className="muted" style={{ fontWeight: 400 }}>{j.company}</span>}
              {j.designation && <span className="muted" style={{ fontWeight: 400 }}>- {j.designation}</span>}
              <button 
                type="button"
                onClick={() => handleCopy(`Judge Name: ${j.name || "Unnamed judge"}\nJudge ID: ${j.judge_code}`, `all-${j.id}`)}
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 'auto', display: 'flex', gap: 6, fontSize: 12, padding: "4px 8px", minHeight: "28px" }}
                title="Copy Judge ID"
              >
                {copiedId === `all-${j.id}` ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copiedId === `all-${j.id}` ? "Copied!" : "Copy Judge ID"}
              </button>
            </div>
            <div className="mono muted" style={{ fontSize: 13, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                ID: {j.judge_code}
                <button type="button" onClick={() => handleCopy(j.judge_code, `id-${j.id}`)} style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", opacity: 0.7 }} title="Copy ID">
                  {copiedId === `id-${j.id}` ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ fontSize: 11, padding: "2px 8px" }}
                  onClick={() => handleResetPassword(j)}
                  disabled={isResetting}
                >
                  Reset Password
                </button>
              </span>
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginLeft: 16 }}
            onClick={async () => {
              if (!confirm(`Remove ${j.name} from judges?`)) return;
              await deleteJudge(hackathonId, j.id, j.auth_user_id);
              router.refresh();
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
