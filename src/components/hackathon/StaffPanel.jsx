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
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '2rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--success-soft)', color: 'var(--success)', padding: '1rem', borderRadius: '50%' }}>
                <Key size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Staff Created Successfully</h3>
                <p className="muted" style={{ margin: '4px 0 0 0', fontSize: 13 }}>Share these credentials securely with the staff member.</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div className="muted text-xs" style={{ marginBottom: 4 }}>Staff ID / Username</div>
                <code style={{ fontSize: '1.1rem', background: 'transparent', padding: 0 }}>{newCredentials.staffCode}</code>
              </div>
              <div>
                <div className="muted text-xs" style={{ marginBottom: 4 }}>Temporary Password</div>
                <code style={{ fontSize: '1.1rem', background: 'transparent', padding: 0 }}>{newCredentials.password}</code>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warn)', fontSize: 13, fontWeight: 500 }}>
              <ShieldAlert size={16} /> These credentials will not be shown again.
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.75rem' }}
                onClick={() => {
                  const text = `Hackathon Login\nUsername: ${newCredentials.staffCode}\nPassword: ${newCredentials.password}`;
                  handleCopy(text, 'full-creds');
                }}
              >
                {copiedId === 'full-creds' ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Credentials</>}
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.75rem' }}
                onClick={() => setNewCredentials(null)}
              >
                Done
              </button>
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
