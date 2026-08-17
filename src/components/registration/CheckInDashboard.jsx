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
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const fetchTeams = useCallback(async () => {
    if (!hackathonId) return;
    setLoading(true);
    setError(null);
    const res = await searchTeams(hackathonId, "");
    if (res.error) {
      setError(res.error);
      toast.error(res.error);
    } else {
      setAllTeams(res.teams || []);
    }
    setLoading(false);
  }, [hackathonId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Client-side search
  const filteredTeams = useMemo(() => {
    if (!query.trim()) return allTeams;
    const lower = query.toLowerCase();
    return allTeams.filter(t => 
      t.name?.toLowerCase().includes(lower) || 
      t.team_code?.toLowerCase().includes(lower) || 
      t.leader_name?.toLowerCase().includes(lower) || 
      t.phone?.includes(lower) ||
      t.email?.toLowerCase().includes(lower)
    );
  }, [allTeams, query]);

  const handleCheckInFull = async (teamId, members) => {
    setProcessingId(teamId);
    
    // Optimistic Update
    const previousTeams = [...allTeams];
    setAllTeams(allTeams.map(t => {
      if (t.id === teamId) {
        const presentCount = members.filter(m => m.status === 'Present').length;
        const totalCount = members.length;
        let newStatus = "Registered";
        if (totalCount > 0) {
          if (presentCount === 0) newStatus = "Registered";
          else if (presentCount < totalCount) newStatus = "Partially Checked In";
          else newStatus = "Checked-In";
        } else {
          newStatus = "Checked-In";
        }
        return { 
          ...t, 
          status: newStatus, 
          members: JSON.stringify(members),
          // We don't have the table number yet, but the UI can just show a temporary one or wait for the real one
        };
      }
      return t;
    }));
    
    setSelectedTeam(null);

    const res = await checkInTeam(teamId, hackathonId, members);
    setProcessingId(null);
    
    if (res.error) {
      toast.error(res.error);
      setAllTeams(previousTeams); // Rollback
    } else {
      // Update with the real team_number and table_number returned from backend
      setAllTeams(currentTeams => currentTeams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            status: res.status,
            team_number: res.team_number || t.team_number,
            table_number: res.table_number || t.table_number,
            arrival_time: t.arrival_time || new Date().toISOString()
          };
        }
        return t;
      }));
      
      if (res.status === 'Checked-In') {
        toast.success(`Fully checked in! Team: ${res.team_number}, Table: ${res.table_number}`);
      } else if (res.status === 'Partially Checked In') {
        toast.success(`Partially checked in. Team: ${res.team_number || 'Pending'}, Table: ${res.table_number || 'Pending'}`);
      } else {
        toast.success("Check-in updated.");
      }
    }
  };



  const handleUndo = async (team) => {
    if (!confirm(`Undo check-in for ${team.name}? This removes their team and table number.`)) return;
    
    setProcessingId(team.id);
    
    // Optimistic Rollback
    const previousTeams = [...allTeams];
    setAllTeams(allTeams.map(t => {
      if (t.id === team.id) {
        let updatedMembers = t.members;
        try {
          const parsed = JSON.parse(t.members || "[]");
          updatedMembers = JSON.stringify(parsed.map(m => ({ ...m, status: 'Pending' })));
        } catch(e) {}
        return { 
          ...t, 
          status: 'Registered', 
          team_number: null, 
          table_number: null, 
          arrival_time: null,
          members: updatedMembers
        };
      }
      return t;
    }));

    const res = await undoCheckIn(team.id, hackathonId);
    setProcessingId(null);
    
    if (res.error) {
      toast.error(res.error);
      setAllTeams(previousTeams); // Revert rollback on failure
    } else {
      toast.success("Check-in undone.");
    }
  };

  const stats = {
    total: allTeams.length,
    checkedIn: allTeams.filter(t => t.status === "Checked-In").length,
    partial: allTeams.filter(t => t.status === "Partially Checked In").length,
    pending: allTeams.filter(t => t.status === "Registered").length
  };
  
  const recentCheckIns = [...allTeams]
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
                {loading && allTeams.length === 0 ? (
                  <tr><td colSpan={5} className="text-center muted" style={{ padding: '3rem' }}>Searching...</td></tr>
                ) : filteredTeams.length === 0 && !error ? (
                  <tr><td colSpan={5} className="text-center muted" style={{ padding: '3rem' }}>No teams found.</td></tr>
                ) : (
                  filteredTeams.map((t) => {
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
