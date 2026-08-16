"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function TeamModal({ hackathonId, initialData, onClose, onSubmit }) {
  const [members, setMembers] = useState(() => {
    if (initialData?.members) {
      try { return JSON.parse(initialData.members); } 
      catch (e) { return []; }
    }
    return [];
  });
  
  const [error, setError] = useState(null);

  const addMember = () => setMembers([...members, { name: "", email: "", phone: "", status: "Pending" }]);
  
  const updateMember = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };
  
  const removeMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.target);
    
    const teamIdValue = formData.get("teamCode")?.toString().trim();
    if (!teamIdValue) {
      setError("Team ID is required.");
      return;
    }
    // Auto convert uppercase in frontend before submit, though backend will also do it
    formData.set("teamCode", teamIdValue.toUpperCase());
    
    const validMembers = members
      .filter(m => m.name.trim() !== "")
      .map(m => ({ ...m, status: m.status || 'Pending' }));
      
    if (validMembers.length === 0 && !initialData) {
      setError("At least one team member is required.");
      return;
    }
    formData.append("members", JSON.stringify(validMembers));

    try {
      await onSubmit(formData);
      toast.success(initialData ? "Team updated successfully" : "Team created successfully");
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '2rem'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        position: 'relative', padding: 0, overflow: 'hidden'
      }}>
        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
          <h2 className="title" style={{ fontSize: '1.5rem', margin: 0 }}>
            {initialData ? "Edit Team" : "Create New Team"}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            
            <div className="field" style={{ marginBottom: '1.5rem' }}>
            <label>Team Name *</label>
            <input className="input" name="name" required defaultValue={initialData?.name} placeholder="e.g. Code Ninjas" />
          </div>
          
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '1.5rem 0' }}></div>
          
          <h3 className="subtitle" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Team Leader</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="field">
              <label>Leader Name *</label>
              <input className="input" name="leaderName" required defaultValue={initialData?.leader_name} placeholder="e.g. John Doe" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field">
                <label>Leader Email *</label>
                <input type="email" className="input" name="leaderEmail" required defaultValue={initialData?.email} placeholder="john@example.com" />
              </div>
              <div className="field">
                <label>Leader Phone *</label>
                <input className="input" name="leaderPhone" required defaultValue={initialData?.phone} placeholder="+1 234 567 8900" />
              </div>
            </div>
          </div>
          
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '1.5rem 0' }}></div>
          
          <h3 className="subtitle" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Members</h3>
          <div style={{ marginBottom: '1.5rem' }}>
            {members.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input className="input" placeholder="Member Name *" required value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" placeholder="Email (Optional)" type="email" value={m.email || ''} onChange={(e) => updateMember(i, 'email', e.target.value)} />
                    <input className="input" placeholder="Phone (Optional)" value={m.phone || ''} onChange={(e) => updateMember(i, 'phone', e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => removeMember(i)} className="btn btn-secondary btn-sm" style={{ padding: '0.75rem', height: 44 }}><X size={16}/></button>
              </div>
            ))}
            <button type="button" onClick={addMember} className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
              <Plus size={16} /> Add Member
            </button>
          </div>
          
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '1.5rem 0' }}></div>
          
            <div className="field" style={{ marginBottom: '0.5rem' }}>
              <label>Team ID *</label>
              <p className="muted text-xs" style={{ marginBottom: 8 }}>Unique Team Identifier (e.g. T-001)</p>
              <input 
                className="input mono" 
                name="teamCode" 
                required 
                defaultValue={initialData?.team_code} 
                placeholder="e.g. T-001" 
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>
          
          <div style={{ padding: '1rem 2rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <SubmitButton pendingText="Saving…">
              {initialData ? "Save Changes" : "Create Team"}
            </SubmitButton>
          </div>
          
        </form>
      </div>
    </div>
  );
}
