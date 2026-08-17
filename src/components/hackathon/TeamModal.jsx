"use client";

import { useState, useEffect } from "react";
import SubmitButton from "@/components/SubmitButton";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function TeamModal({ hackathonId, initialData, onClose, onSubmit }) {
  const [members, setMembers] = useState(() => {
    if (initialData?.members) {
      try { return JSON.parse(initialData.members); } 
      catch (e) { return []; }
    }
    return [{ name: "", email: "", phone: "", status: "Pending" }];
  });
  
  const [foodPurchased, setFoodPurchased] = useState(initialData?.food_purchased || false);
  const [foodPaymentStatus, setFoodPaymentStatus] = useState(initialData?.food_payment_status || "Pending");
  const [foodQuantity, setFoodQuantity] = useState(initialData?.food_quantity || members.length);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(null);

  // Auto-sync food quantity with member count if they haven't explicitly set it yet
  // or if they add a new member.
  useEffect(() => {
    if (!initialData) {
      setFoodQuantity(members.length);
    }
  }, [members.length, initialData]);

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
    formData.set("teamCode", teamIdValue.toUpperCase());
    
    const validMembers = members
      .filter(m => m.name.trim() !== "")
      .map(m => ({ ...m, status: m.status || 'Pending' }));
      
    if (validMembers.length === 0 && !initialData) {
      setError("At least one team member is required.");
      return;
    }
    
    formData.append("members", JSON.stringify(validMembers));
    formData.append("foodPurchased", foodPurchased);
    formData.append("foodPaymentStatus", foodPaymentStatus);
    formData.append("foodQuantity", foodQuantity);

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
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '600px', maxHeight: '95vh', display: 'flex', flexDirection: 'column',
        position: 'relative', padding: 0, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
          <h2 className="title" style={{ fontSize: '1.25rem', margin: 0 }}>
            {initialData ? "Edit Team" : "Add New Team"}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="field">
                <label>Team Name *</label>
                <input className="input" name="name" required defaultValue={initialData?.name} placeholder="e.g. Code Ninjas" autoFocus />
              </div>
              <div className="field">
                <label>Team ID *</label>
                <input className="input mono" name="teamCode" required defaultValue={initialData?.team_code} placeholder="T-001" style={{ textTransform: 'uppercase' }} />
              </div>
            </div>
          
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="field">
                <label>Leader Name *</label>
                <input className="input" name="leaderName" required defaultValue={initialData?.leader_name} placeholder="Name" />
              </div>
              <div className="field">
                <label>Leader Phone *</label>
                <input className="input" name="leaderPhone" required defaultValue={initialData?.phone} placeholder="Phone" />
              </div>
            </div>
            
            <div className="field" style={{ marginBottom: '1.5rem' }}>
              <label>Leader Email *</label>
              <input type="email" className="input" name="leaderEmail" required defaultValue={initialData?.email} placeholder="leader@example.com" />
            </div>
          
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ margin: 0, fontWeight: 500 }}>Team Members</label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {members.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="input" placeholder="Member Name" required value={m.name} onChange={(e) => updateMember(i, 'name', e.target.value)} style={{ flex: 1 }} />
                  <input className="input" placeholder="Email (Optional)" type="email" value={m.email || ''} onChange={(e) => updateMember(i, 'email', e.target.value)} style={{ flex: 1 }} />
                  {members.length > 1 && (
                    <button type="button" onClick={() => removeMember(i)} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem' }}><X size={16}/></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMember} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                <Plus size={14} /> Add Member
              </button>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 500 }}
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Food & Payment
            </button>
            
            {showAdvanced && (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '1rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>Food Included</div>
                    <div className="muted" style={{ fontSize: 12 }}>Does this team get food?</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={foodPurchased} onChange={e => setFoodPurchased(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>

                {foodPurchased && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <div className="field">
                      <label>Payment Status</label>
                      <select className="input" value={foodPaymentStatus} onChange={e => setFoodPaymentStatus(e.target.value)}>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Food Quantity</label>
                      <input type="number" min="0" className="input" value={foodQuantity} onChange={e => setFoodQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
          
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
