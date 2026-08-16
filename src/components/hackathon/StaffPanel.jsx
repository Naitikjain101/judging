"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addStaff, deleteStaff } from "@/app/organizer/hackathons/actions";
import SubmitButton from "@/components/SubmitButton";
import { Copy, Check } from "lucide-react";

export default function StaffPanel({ hackathonId, staff }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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
                  <th>Password</th>
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
                    <td>
                      <code style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }} onClick={() => handleCopy(s.password, `pass-${s.id}`)}>
                        {s.password} {copiedId === `pass-${s.id}` ? <Check size={14} /> : <Copy size={14} />}
                      </code>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        onClick={async () => {
                          await deleteStaff(hackathonId, s.id);
                          router.refresh();
                        }}
                      >
                        Delete
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
