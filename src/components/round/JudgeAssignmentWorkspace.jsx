"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Users, Copy, Check, ChevronDown, CheckSquare, Square, X, Settings2 } from "lucide-react";
import { saveBulkAssignments } from "@/app/organizer/hackathons/actions";

export default function JudgeAssignmentWorkspace({ hackathonId, roundId, judges, roundTeams, assignments }) {
  const [mode, setMode] = useState("judge-to-team"); // 'judge-to-team' | 'team-to-judge'
  const [selectedItem, setSelectedItem] = useState(null); // ID of selected judge or team
  
  // Local state for assignments to allow preview before saving
  const [localAssignments, setLocalAssignments] = useState(assignments || []);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Target judges per team (can be configured)
  const [targetPerTeam, setTargetPerTeam] = useState(3);

  // Compute changes for save button
  const hasChanges = useMemo(() => {
    if (localAssignments.length !== assignments.length) return true;
    
    // Check if every local assignment exists in original
    const allMatch = localAssignments.every(local => 
      assignments.some(orig => orig.judge_id === local.judge_id && orig.team_id === local.team_id)
    );
    
    return !allMatch;
  }, [localAssignments, assignments]);

  // Derived metrics
  const metrics = useMemo(() => {
    const judgeWorkloads = {};
    const teamAssignCounts = {};
    
    judges.forEach(j => judgeWorkloads[j.id] = 0);
    roundTeams.forEach(t => teamAssignCounts[t.id] = 0);
    
    localAssignments.forEach(a => {
      if (judgeWorkloads[a.judge_id] !== undefined) judgeWorkloads[a.judge_id]++;
      if (teamAssignCounts[a.team_id] !== undefined) teamAssignCounts[a.team_id]++;
    });
    
    const fullyAssignedTeams = Object.values(teamAssignCounts).filter(c => c >= targetPerTeam).length;
    const partiallyAssignedTeams = Object.values(teamAssignCounts).filter(c => c > 0 && c < targetPerTeam).length;
    const unassignedTeams = Object.values(teamAssignCounts).filter(c => c === 0).length;
    
    return { judgeWorkloads, teamAssignCounts, fullyAssignedTeams, partiallyAssignedTeams, unassignedTeams };
  }, [localAssignments, judges, roundTeams, targetPerTeam]);

  // Handlers
  const toggleAssignment = (judgeId, teamId) => {
    setLocalAssignments(prev => {
      const exists = prev.some(a => a.judge_id === judgeId && a.team_id === teamId);
      if (exists) {
        return prev.filter(a => !(a.judge_id === judgeId && a.team_id === teamId));
      } else {
        return [...prev, { round_id: roundId, judge_id: judgeId, team_id: teamId }];
      }
    });
  };

  const handleBulkAssign = (selectAll) => {
    if (!selectedItem) return;
    
    setLocalAssignments(prev => {
      let newAssignments = [...prev];
      
      if (mode === 'judge-to-team') {
        const judgeId = selectedItem;
        if (selectAll) {
          // Assign to all filtered teams
          filteredTeams.forEach(t => {
            if (!newAssignments.some(a => a.judge_id === judgeId && a.team_id === t.id)) {
              newAssignments.push({ round_id: roundId, judge_id: judgeId, team_id: t.id });
            }
          });
        } else {
          // Unassign from all filtered teams
          const filteredIds = filteredTeams.map(t => t.id);
          newAssignments = newAssignments.filter(a => !(a.judge_id === judgeId && filteredIds.includes(a.team_id)));
        }
      } else {
        const teamId = selectedItem;
        if (selectAll) {
          // Assign all filtered judges to this team
          filteredJudges.forEach(j => {
            if (!newAssignments.some(a => a.judge_id === j.id && a.team_id === teamId)) {
              newAssignments.push({ round_id: roundId, judge_id: j.id, team_id: teamId });
            }
          });
        } else {
          // Unassign all filtered judges
          const filteredIds = filteredJudges.map(j => j.id);
          newAssignments = newAssignments.filter(a => !(a.team_id === teamId && filteredIds.includes(a.judge_id)));
        }
      }
      return newAssignments;
    });
  };

  const handleAutoAssign = () => {
    if (!confirm("This will overwrite your unsaved changes and distribute teams evenly among judges. Proceed?")) return;
    
    const newAssignments = [];
    const numJudges = judges.length;
    if (numJudges === 0) return toast.error("No judges available.");
    
    let judgeIndex = 0;
    
    // Assign exactly targetPerTeam judges to each team
    roundTeams.forEach(team => {
      for (let i = 0; i < targetPerTeam; i++) {
        const judge = judges[judgeIndex % numJudges];
        newAssignments.push({
          round_id: roundId,
          judge_id: judge.id,
          team_id: team.id
        });
        judgeIndex++;
      }
    });
    
    setLocalAssignments(newAssignments);
    toast.success("Auto-assignment generated. Don't forget to save.");
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveBulkAssignments(hackathonId, roundId, localAssignments);
    setIsSaving(false);
    
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Assignments saved successfully!");
    }
  };

  const handleDiscard = () => {
    if (confirm("Discard all unsaved changes?")) {
      setLocalAssignments(assignments);
      setSelectedItem(null);
    }
  };

  // Filtered lists
  const filteredJudges = judges.filter(j => 
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.judge_code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredTeams = roundTeams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.team_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', minHeight: 600 }}>
      {/* Workspace Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <div className="eyebrow">Assignment Mode</div>
            <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: 100, padding: 4 }}>
              <button 
                className={`btn btn-sm ${mode === 'judge-to-team' ? 'btn-secondary' : ''}`} 
                style={{ borderRadius: 100, border: 'none', background: mode === 'judge-to-team' ? 'var(--bg-elevated)' : 'transparent' }}
                onClick={() => { setMode('judge-to-team'); setSelectedItem(null); setSearchQuery(""); }}
              >
                Judge → Teams
              </button>
              <button 
                className={`btn btn-sm ${mode === 'team-to-judge' ? 'btn-secondary' : ''}`}
                style={{ borderRadius: 100, border: 'none', background: mode === 'team-to-judge' ? 'var(--bg-elevated)' : 'transparent' }}
                onClick={() => { setMode('team-to-judge'); setSelectedItem(null); setSearchQuery(""); }}
              >
                Team → Judges
              </button>
            </div>
          </div>
          
          <div style={{ height: 40, width: 1, background: 'var(--border-subtle)' }}></div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="text-sm fw-600" style={{ color: metrics.unassignedTeams > 0 ? 'var(--warn)' : 'var(--success)' }}>
                {metrics.unassignedTeams}
              </div>
              <div className="text-xs muted">Unassigned Teams</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-sm fw-600">{metrics.partiallyAssignedTeams}</div>
              <div className="text-xs muted">Partial Teams</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="text-sm fw-600" style={{ color: 'var(--success)' }}>{metrics.fullyAssignedTeams}</div>
              <div className="text-xs muted">Fully Assigned</div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
            <label className="text-sm muted">Target Judges/Team:</label>
            <input 
              type="number" 
              className="input" 
              style={{ width: 60, padding: '4px 8px', height: 32 }} 
              value={targetPerTeam}
              onChange={(e) => setTargetPerTeam(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
            />
          </div>
          
          <button className="btn btn-secondary btn-sm" onClick={handleAutoAssign}>
            <Settings2 size={14} /> Auto Assign
          </button>
          
          {hasChanges && (
            <>
              <button className="btn btn-danger btn-sm" onClick={handleDiscard} disabled={isSaving}>Discard</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Workspace Split Panels */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Panel (Selection) */}
        <div style={{ width: 350, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input" 
                style={{ paddingLeft: 36, borderRadius: 100 }}
                placeholder={mode === 'judge-to-team' ? "Search judges..." : "Search teams..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {mode === 'judge-to-team' ? (
              // Judge List
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredJudges.map(j => {
                  const workload = metrics.judgeWorkloads[j.id];
                  const isSelected = selectedItem === j.id;
                  return (
                    <button 
                      key={j.id}
                      onClick={() => setSelectedItem(j.id)}
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isSelected ? 'var(--accent-soft)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderLeft: isSelected ? '4px solid var(--accent-primary)' : '4px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div className="fw-600">{j.name}</div>
                        <div className="text-xs muted">{j.judge_code}</div>
                      </div>
                      <div className="badge" style={{ background: workload > 10 ? 'var(--warn-soft)' : 'var(--bg-elevated)' }}>
                        {workload} teams
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              // Team List
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredTeams.map(t => {
                  const assignCount = metrics.teamAssignCounts[t.id];
                  const isSelected = selectedItem === t.id;
                  let statusColor = 'var(--bg-elevated)';
                  if (assignCount >= targetPerTeam) statusColor = 'var(--success-soft)';
                  else if (assignCount > 0) statusColor = 'var(--warn-soft)';
                  
                  return (
                    <button 
                      key={t.id}
                      onClick={() => setSelectedItem(t.id)}
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isSelected ? 'var(--accent-soft)' : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderLeft: isSelected ? '4px solid var(--accent-primary)' : '4px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div className="fw-600">{t.name}</div>
                        <div className="text-xs muted">{t.team_code}</div>
                      </div>
                      <div className="badge" style={{ background: statusColor }}>
                        {assignCount}/{targetPerTeam} judges
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel (Mapping) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)' }}>
          {!selectedItem ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                <p>Select a {mode === 'judge-to-team' ? 'judge' : 'team'} to manage assignments</p>
              </div>
            </div>
          ) : (
            <>
              {/* Right Panel Header */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }}>
                {mode === 'judge-to-team' ? (() => {
                  const judge = judges.find(j => j.id === selectedItem);
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 className="title" style={{ fontSize: '1.25rem', margin: 0 }}>{judge.name}</h2>
                        <div className="text-sm muted" style={{ marginTop: 4 }}>Assigning teams to this judge</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAssign(true)}>Select All Shown</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAssign(false)}>Clear All Shown</button>
                      </div>
                    </div>
                  );
                })() : (() => {
                  const team = roundTeams.find(t => t.id === selectedItem);
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 className="title" style={{ fontSize: '1.25rem', margin: 0 }}>{team.name}</h2>
                        <div className="text-sm muted" style={{ marginTop: 4 }}>Assigning judges to this team</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAssign(true)}>Select All Shown</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleBulkAssign(false)}>Clear All Shown</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Right Panel Grid */}
              <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {mode === 'judge-to-team' ? (
                    // Show all teams with checkboxes
                    filteredTeams.map(t => {
                      const isAssigned = localAssignments.some(a => a.judge_id === selectedItem && a.team_id === t.id);
                      return (
                        <label 
                          key={t.id}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem',
                            border: `1px solid ${isAssigned ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            borderRadius: 12, cursor: 'pointer',
                            background: isAssigned ? 'var(--accent-soft)' : 'var(--bg-main)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isAssigned}
                            onChange={() => toggleAssignment(selectedItem, t.id)}
                            style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent-primary)' }}
                          />
                          <div>
                            <div className="fw-600">{t.name}</div>
                            <div className="text-xs muted" style={{ marginTop: 4 }}>ID: {t.team_code}</div>
                            <div className="text-xs muted" style={{ marginTop: 4 }}>
                              Total assigned: {metrics.teamAssignCounts[t.id]}/{targetPerTeam}
                            </div>
                          </div>
                        </label>
                      )
                    })
                  ) : (
                    // Show all judges with checkboxes
                    filteredJudges.map(j => {
                      const isAssigned = localAssignments.some(a => a.team_id === selectedItem && a.judge_id === j.id);
                      return (
                        <label 
                          key={j.id}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem',
                            border: `1px solid ${isAssigned ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            borderRadius: 12, cursor: 'pointer',
                            background: isAssigned ? 'var(--accent-soft)' : 'var(--bg-main)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isAssigned}
                            onChange={() => toggleAssignment(j.id, selectedItem)}
                            style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent-primary)' }}
                          />
                          <div>
                            <div className="fw-600">{j.name}</div>
                            <div className="text-xs muted" style={{ marginTop: 4 }}>ID: {j.judge_code}</div>
                            <div className="text-xs muted" style={{ marginTop: 4 }}>
                              Current workload: {metrics.judgeWorkloads[j.id]} teams
                            </div>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
