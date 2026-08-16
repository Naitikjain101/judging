"use client";

import { useState } from "react";
import { X, CheckCircle, Clock, User, Phone, Mail, Hash, Check } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";

export default function TeamDetailsDrawer({ team, hackathon, onClose, onCheckInFull, onCheckInPartial }) {
  const [members, setMembers] = useState(() => {
    try {
      return JSON.parse(team.members || "[]");
    } catch(e) {
      return [];
    }
  });

  const toggleMemberPresent = (index) => {
    const newMembers = [...members];
    newMembers[index].status = newMembers[index].status === 'Present' ? 'Pending' : 'Present';
    setMembers(newMembers);
  };

  const presentCount = members.filter(m => m.status === 'Present').length;
  const totalCount = members.length;
  const progressPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const handlePartialSubmit = async (e) => {
    e.preventDefault();
    await onCheckInPartial(team.id, members);
  };

  const handleFullSubmit = async (e) => {
    e.preventDefault();
    await onCheckInFull(team.id, members);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 1000
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '500px', height: '100vh', borderRadius: 0,
        display: 'flex', flexDirection: 'column', padding: 0, margin: 0,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="title" style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {team.name}
            </h2>
            <div className="muted text-sm mono" style={{ marginTop: 4 }}>ID: {team.team_code}</div>
          </div>
          <button type="button" onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          
          {/* Status Bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="badge badge-active" style={{ fontSize: '0.85rem' }}>{team.status || 'Registered'}</div>
            {team.team_number && <div className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-primary)' }}>Team {team.team_number}</div>}
            {team.table_number && <div className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-primary)' }}>Table {team.table_number}</div>}
          </div>

          <h3 className="subtitle" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Team Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div className="eyebrow">Created Date</div>
              <div className="text-sm">{new Date(team.created_at).toLocaleDateString()}</div>
            </div>
            {team.arrival_time && (
              <div>
                <div className="eyebrow">Arrival Time</div>
                <div className="text-sm">{new Date(team.arrival_time).toLocaleTimeString()}</div>
              </div>
            )}
          </div>

          <h3 className="subtitle" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Team Leader</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}><User size={16} className="muted" /> {team.leader_name}</div>
            {team.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Mail size={16} className="muted" /> {team.email}</div>}
            {team.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Phone size={16} className="muted" /> {team.phone}</div>}
          </div>

          <h3 className="subtitle" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            Team Members
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="text-sm fw-500">Attendance</span>
              <span className="text-sm mono">{presentCount} / {totalCount} Members Present</span>
            </div>
            <div style={{ width: '100%', height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--success)', transition: 'width 0.3s ease' }}></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {members.length === 0 ? (
              <div className="muted text-sm text-center" style={{ padding: '1rem' }}>No members found.</div>
            ) : (
              members.map((m, i) => {
                const isPresent = m.status === 'Present';
                return (
                  <label key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                    border: `1px solid ${isPresent ? 'var(--success)' : 'var(--border-subtle)'}`, 
                    borderRadius: 8, cursor: 'pointer',
                    background: isPresent ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={isPresent} 
                      onChange={() => toggleMemberPresent(i)} 
                      style={{ width: 18, height: 18, accentColor: 'var(--success)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                        {m.email && <span className="muted text-xs">{m.email}</span>}
                        {m.phone && <span className="muted text-xs">{m.phone}</span>}
                      </div>
                    </div>
                    {isPresent ? (
                      <span className="badge badge-active text-xs" style={{ borderColor: 'var(--success)', color: 'var(--success)', background: 'rgba(16,185,129,0.1)' }}>Present</span>
                    ) : (
                      <span className="badge text-xs">Pending</span>
                    )}
                  </label>
                )
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <form onSubmit={handleFullSubmit}>
            <SubmitButton className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} pendingText="Checking in...">
              <CheckCircle size={18} /> Check In Entire Team
            </SubmitButton>
          </form>
          
          <form onSubmit={handlePartialSubmit}>
            <SubmitButton className="btn btn-secondary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} pendingText="Saving...">
              <Clock size={18} /> Save Partial Check-In
            </SubmitButton>
          </form>
        </div>

      </div>
    </div>
  );
}
