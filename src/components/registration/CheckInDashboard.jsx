"use client";

import { useState, useEffect, useCallback } from "react";
import { searchTeams, checkInTeam, undoCheckIn } from "@/app/registration/actions";
import { toast } from "sonner";
import { Search, CheckCircle, Clock, QrCode, Coffee, History } from "lucide-react";
import TeamDetailsDrawer from "./TeamDetailsDrawer";

/**
 * Check-in dashboard — auto-scoped to a single hackathon (the one
 * the registration desk staff member is assigned to).
 */
export default function CheckInDashboard({ hackathon }) {
  const hackathonId = hackathon.id;
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchTeams = useCallback(async () => {
    if (!hackathonId) return;
    setLoading(true);
    setError(null);
    const res = await searchTeams(hackathonId, query);
    if (res.error) {
      setError(res.error);
      toast.error(res.error);
    } else {
      setTeams(res.teams || []);
    }
    setLoading(false);
  }, [hackathonId, query]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeams();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchTeams]);

  const handleCheckInFull = async (teamId, members) => {
    setProcessingId(teamId);
    const updatedMembers = members.map(m => ({ ...m, status: 'Present' }));
    const res = await checkInTeam(teamId, hackathonId, updatedMembers);
    setProcessingId(null);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      if (res.status === 'Checked-In') {
        toast.success(`Fully checked in! Team: ${res.team_number}, Table: ${res.table_number}`);
      } else if (res.status === 'Partially Checked In') {
        toast.success(`Partially checked in. Team: ${res.team_number}, Table: ${res.table_number}`);
      } else {
        toast.success("Check-in updated.");
      }
      setSelectedTeam(null);
      fetchTeams();
    }
  };



  const handleUndo = async (team) => {
    if (!confirm(`Undo check-in for ${team.name}? This removes their team and table number.`)) return;
    
    setProcessingId(team.id);
    const res = await undoCheckIn(team.id, hackathonId);
    setProcessingId(null);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Check-in undone.");
      fetchTeams();
    }
  };

  const stats = {
    total: teams.length,
    checkedIn: teams.filter(t => t.status === "Checked-In").length,
    partial: teams.filter(t => t.status === "Partially Checked In").length,
    pending: teams.filter(t => t.status === "Registered").length
  };
  
  const recentCheckIns = [...teams]
    .filter(t => t.status === "Checked-In" && t.arrival_time)
    .sort((a, b) => new Date(b.arrival_time) - new Date(a.arrival_time))
    .slice(0, 10);

  return (
    <div>
      {/* Stats Bar */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '3rem', flex: 1, justifyContent: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big">{stats.total}</div>
            <div className="eyebrow">Total Found</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--success)' }}>{stats.checkedIn}</div>
            <div className="eyebrow">Checked In</div>
          </div>
          {stats.partial > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div className="score-big" style={{ color: 'var(--warn)' }}>{stats.partial}</div>
              <div className="eyebrow">Partial</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--warn)' }}>{stats.pending}</div>
            <div className="eyebrow">Pending</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Main Check-In Area */}
        <div>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input" 
                style={{ paddingLeft: 48, fontSize: '1rem', padding: '1rem 1rem 1rem 48px', borderRadius: 100 }}
                placeholder="Search by ID, Name, Phone, Email..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Team Info</th>
                  <th>Food</th>
                  <th>Assignment</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && teams.length === 0 ? (
                  <tr><td colSpan={5} className="text-center muted" style={{ padding: '3rem' }}>Searching...</td></tr>
                ) : teams.length === 0 && !error ? (
                  <tr><td colSpan={5} className="text-center muted" style={{ padding: '3rem' }}>No teams found.</td></tr>
                ) : (
                  teams.map((t) => {
                    const isCheckedIn = t.status === "Checked-In";
                    const isPartiallyCheckedIn = t.status === "Partially Checked In";
                    let statusColor = '';
                    if (isCheckedIn) statusColor = 'badge-active';
                    else if (isPartiallyCheckedIn) statusColor = 'badge-warning';

                    return (
                      <tr 
                        key={t.id} 
                        style={{ 
                          background: isCheckedIn ? 'rgba(16, 185, 129, 0.05)' : isPartiallyCheckedIn ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => setSelectedTeam(t)}
                        className="hover-row"
                      >
                        <td>
                          <span className={`badge ${statusColor}`}>
                            {isCheckedIn ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t.name}</div>
                          <div className="muted text-xs mono">ID: {t.team_code} | {t.leader_name}</div>
                        </td>
                        <td>
                          {t.food_purchased ? (
                            <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)', borderColor: 'var(--accent-dim)' }}>
                              <Coffee size={12}/> {t.food_package || 'Prepaid'}
                            </span>
                          ) : (
                            <span className="muted text-xs">Pending</span>
                          )}
                        </td>
                        <td>
                          {isCheckedIn || isPartiallyCheckedIn ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span className="badge" style={{ background: 'var(--bg-elevated)', color: '#FFF' }}>Team {t.team_number}</span>
                              <span className="badge" style={{ background: 'var(--bg-elevated)', color: '#FFF' }}>Table {t.table_number}</span>
                            </div>
                          ) : (
                            <span className="muted text-xs italic">Pending Check-in</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedTeam(t); }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Sidebar History */}
        <div>
          <div className="card" style={{ height: '100%' }}>
            <h3 className="subtitle" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <History size={18} /> Recent Check-Ins
            </h3>
            
            {recentCheckIns.length === 0 ? (
              <div className="muted text-center" style={{ padding: '2rem 0' }}>No recent check-ins</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentCheckIns.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', marginTop: 6 }}></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div className="muted text-xs">Team {t.team_number} • Table {t.table_number}</div>
                      <div className="muted text-xs" style={{ marginTop: 4 }}>
                        {new Date(t.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {selectedTeam && (
        <TeamDetailsDrawer 
          team={selectedTeam} 
          hackathon={hackathon}
          onClose={() => setSelectedTeam(null)}
          onCheckInFull={handleCheckInFull}
        />
      )}
    </div>
  );
}
