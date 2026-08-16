"use client";

import { X, CheckCircle, XCircle } from "lucide-react";

export default function TeamViewModal({ team, onClose }) {
  if (!team) return null;

  let parsedMembers = [];
  try {
    parsedMembers = JSON.parse(team.members || "[]");
  } catch (e) {}

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
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
          <h2 className="title" style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {team.name}
            <span className={`badge ${team.status === 'Checked-In' ? 'badge-active' : 'badge-default'}`} style={{ fontSize: '0.8rem' }}>
              {team.status || 'Registered'}
            </span>
          </h2>
          <p className="muted mono" style={{ marginTop: 8 }}>{team.team_code}</p>
        </div>

        <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p className="muted text-sm">Leader</p>
              <p style={{ fontWeight: 500 }}>{team.leader_name || "-"}</p>
            </div>
            <div>
              <p className="muted text-sm">Email</p>
              <p>{team.email || "-"}</p>
            </div>
            <div>
              <p className="muted text-sm">Phone</p>
              <p>{team.phone || "-"}</p>
            </div>
            <div>
              <p className="muted text-sm">Track</p>
              <p>{team.track || "-"}</p>
            </div>
            <div>
              <p className="muted text-sm">Food Purchased</p>
              <p>{team.food_purchased ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="muted text-sm">Table Number</p>
              <p className="mono">{team.table_number || "-"}</p>
            </div>
          </div>

          <h3 className="subtitle" style={{ fontSize: '1rem', marginBottom: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            Members ({parsedMembers.length})
          </h3>
          
          {parsedMembers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {parsedMembers.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0 }}>{m.name}</p>
                    {(m.email || m.phone) && (
                      <p className="muted text-sm" style={{ margin: '4px 0 0 0' }}>
                        {m.email} {m.email && m.phone ? '•' : ''} {m.phone}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: m.status === 'Present' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {m.status === 'Present' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="text-sm font-medium">{m.status || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted text-sm">No members found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
