"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addStaff, deleteStaff } from "@/app/organizer/hackathons/actions";
import SubmitButton from "@/components/SubmitButton";
import { Copy, Check, X } from "lucide-react";

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
        <div className="alert alert-success" style={{ marginBottom: 16, position: 'relative' }}>
          <button 
            onClick={() => setNewCredentials(null)} 
            style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
          <h4 style={{ margin: "0 0 8px 0" }}>Staff Member Created Successfully</h4>
          <p style={{ margin: "0 0 12px 0", fontSize: 13 }}>Please securely save these credentials and share them with the staff member. <strong>They will not be shown again.</strong></p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div className="muted text-xs">Staff Code</div>
              <code style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => handleCopy(newCredentials.staffCode, 'new-code')}>
                {newCredentials.staffCode} {copiedId === 'new-code' ? <Check size={14} /> : <Copy size={14} />}
              </code>
            </div>
            <div>
              <div className="muted text-xs">Password</div>
              <code style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => handleCopy(newCredentials.password, 'new-pass')}>
                {newCredentials.password} {copiedId === 'new-pass' ? <Check size={14} /> : <Copy size={14} />}
              </code>
            </div>
          </div>
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
