"use client";

import { useState } from "react";
import { setHackathonCheckInRule } from "@/app/organizer/hackathons/actions";
import { toast } from "sonner";
import SubmitButton from "@/components/SubmitButton";

export default function SettingsPanel({ hackathon }) {
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.target);
    const rule = formData.get("check_in_rule");

    const res = await setHackathonCheckInRule(hackathon.id, rule);
    if (res?.error) {
      setError(res.error);
    } else {
      toast.success("Settings saved successfully.");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 800 }}>
      <h2 className="subtitle" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Registration Desk Settings</h2>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="field">
          <label style={{ fontSize: '1.1rem' }}>Official Check-In Rule</label>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Determine when a team is officially considered "Checked-In" and assigned a Team Number and Table Number.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-elevated)' }}>
              <input 
                type="radio" 
                name="check_in_rule" 
                value="ALL_MEMBERS" 
                defaultChecked={hackathon.check_in_rule !== 'ANY_MEMBER'}
                style={{ marginTop: 4 }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Option A: Require ALL members to be present</div>
                <div className="muted text-sm">Teams will only be fully checked in and receive a table when every registered member has arrived.</div>
              </div>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--bg-elevated)' }}>
              <input 
                type="radio" 
                name="check_in_rule" 
                value="ANY_MEMBER" 
                defaultChecked={hackathon.check_in_rule === 'ANY_MEMBER'}
                style={{ marginTop: 4 }}
              />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Option B: Allow assignment immediately</div>
                <div className="muted text-sm">Teams will receive their table and number as soon as at least one verified member checks in.</div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <SubmitButton pendingText="Saving...">Save Settings</SubmitButton>
        </div>
      </form>
    </div>
  );
}
