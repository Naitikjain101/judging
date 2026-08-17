"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addStaff, deleteStaff } from "@/app/organizer/hackathons/actions";
import SubmitButton from "@/components/SubmitButton";
import { Copy, Check, ShieldAlert, Key } from "lucide-react";

export default function StaffPanel({ hackathonId, staff }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [newCredentials, setNewCredentials] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  async function handleAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      hackathonId,
      name: formData.get("name"),
      role: formData.get("role"),
    };
    const res = await addStaff(payload);
    if (res?.error) {
      setError(res.error);
    } else {
      setError(null);
      e.target.reset();
      setNewCredentials(res.credentials);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <form id="add-staff-form" onSubmit={handleAdd}>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Name</label>
              <input name="name" className="input" required placeholder="John Doe" />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Role</label>
              <select name="role" className="input" required>
                <option value="Registration Desk">Registration Desk</option>
                <option value="Volunteer">Food Stall / Volunteer</option>
              </select>
            </div>
            <SubmitButton>Add Staff</SubmitButton>
          </div>
        </form>
      </div>

      {newCredentials && (
        <div style={{ marginBottom: 16, padding: 16, background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 8 }}>
          <h4 style={{ color: 'var(--success)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={18} /> Staff Created Successfully
          </h4>
          <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted">Staff Code:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontWeight: 600 }}>{newCredentials.staffCode}</span>
                <button onClick={() => handleCopy(newCredentials.staffCode, 'new-code')} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }}>
                  {copiedId === 'new-code' ? <Check size={12} /> : <Copy size={12} />} Copy
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted">Password:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontWeight: 600 }}>{newCredentials.password}</span>
                <button onClick={() => handleCopy(newCredentials.password, 'new-pass')} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }}>
                  {copiedId === 'new-pass' ? <Check size={12} /> : <Copy size={12} />} Copy
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleCopy(`Staff Code: ${newCredentials.staffCode}\nPassword: ${newCredentials.password}`, 'new-all')} 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}
          >
            {copiedId === 'new-all' ? <Check size={16} /> : <Copy size={16} />} Copy Login Credentials
          </button>
        </div>
      )}

      <div className="card">
        {staff.length === 0 ? (
          <div className="empty">No staff members yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Staff Code</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td><span className="badge">{s.role}</span></td>
                    <td>
                      <code style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }} onClick={() => handleCopy(s.staff_code, `code-${s.id}`)}>
                        {s.staff_code} {copiedId === `code-${s.id}` ? <Check size={14} /> : <Copy size={14} />}
                      </code>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={async () => {
                          if (!confirm(`Remove ${s.name} from staff?`)) return;
                          await deleteStaff(hackathonId, s.id);
                          router.refresh();
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
