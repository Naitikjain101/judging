"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { searchTeams, markFoodIssued } from "@/app/volunteer/actions";
import { toast } from "sonner";
import { Search, CheckCircle, Ticket, AlertTriangle, AlertCircle } from "lucide-react";

export default function FoodDistribution({ hackathon }) {
  const hackathonId = hackathon.id;
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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

  useEffect(() => {
    const timer = setTimeout(() => { fetchTeams(); }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchTeams]);

  const handleIssueCoupon = async (team) => {
    if (team.status !== "Checked-In") {
      toast.error("Team is not checked in.");
      return;
    }
    if (!team.food_purchased || team.food_payment_status !== "Paid") {
      toast.error("Team is not eligible for food.");
      return;
    }
    
    setProcessingId(team.id);
    const res = await markFoodIssued(team.id, hackathonId);
    setProcessingId(null);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Coupons issued to ${team.name}`);
      fetchTeams();
    }
  };

  const stats = useMemo(() => {
    return {
      eligible: teams.filter(t => t.food_purchased && t.food_payment_status === "Paid").length,
      distributed: teams.filter(t => t.food_issued).length,
      notCheckedIn: teams.filter(t => t.status !== "Checked-In").length,
    };
  }, [teams]);

  return (
    <div>
      {/* Counters */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '3rem', flex: 1, justifyContent: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big">{stats.eligible}</div>
            <div className="eyebrow">Eligible Teams</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--success)' }}>{stats.distributed}</div>
            <div className="eyebrow">Distributed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--accent-primary)' }}>{Math.max(0, stats.eligible - stats.distributed)}</div>
            <div className="eyebrow">Remaining</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--warn)' }}>{stats.notCheckedIn}</div>
            <div className="eyebrow">Not Checked In</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', width: '100%', marginBottom: '2rem' }}>
        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          className="input" 
          style={{ paddingLeft: 48, fontSize: '1.125rem', padding: '1.25rem 1rem 1.25rem 48px', borderRadius: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-focus)' }}
          placeholder="Search team name, ID, leader, or phone..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && teams.length === 0 ? (
          <div className="text-center muted">Searching...</div>
        ) : teams.length === 0 && !error ? (
          <div className="empty">No teams found.</div>
        ) : (
          teams.map(t => {
            const isCheckedIn = t.status === "Checked-In";
            const isEligible = t.food_purchased && t.food_payment_status === "Paid";
            
            let membersCount = 0;
            try { membersCount = JSON.parse(t.members || "[]").length; } catch(e) {}

            return (
              <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: isCheckedIn ? 1 : 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  
                  {/* Team Details */}
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {t.name}
                      <span className="muted text-sm mono">#{t.team_code}</span>
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                      <div>
                        <div className="muted text-xs">Leader Name</div>
                        <div style={{ fontWeight: 500 }}>{t.leader_name || "N/A"}</div>
                      </div>
                      <div>
                        <div className="muted text-xs">Leader Phone</div>
                        <div style={{ fontWeight: 500 }}>{t.phone || "N/A"}</div>
                      </div>
                      <div>
                        <div className="muted text-xs">Team Size</div>
                        <div style={{ fontWeight: 500 }}>{membersCount} Members</div>
                      </div>
                      {t.college && (
                        <div>
                          <div className="muted text-xs">College</div>
                          <div style={{ fontWeight: 500 }}>{t.college}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status & Action */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '250px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${isCheckedIn ? 'badge-active' : 'badge-warning'}`}>
                        {isCheckedIn ? "Checked In" : "Not Checked In"}
                      </span>
                      
                      {!t.food_purchased ? (
                        <span className="badge badge-default">Food Not Included</span>
                      ) : (
                        <span className={`badge ${t.food_payment_status === 'Paid' ? 'badge-active' : 'badge-error'}`}>
                          Food: {t.food_payment_status}
                        </span>
                      )}
                      
                      {isEligible && (
                        <span className="badge badge-default">Qty: {t.food_quantity || membersCount}</span>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '0.5rem' }}>
                      {t.food_issued ? (
                        <div style={{ padding: '0.75rem 1rem', background: 'var(--success-soft)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
                          <CheckCircle size={18} /> Coupon Distributed
                          <span className="text-xs" style={{ marginLeft: 'auto', fontWeight: 400 }}>
                            {new Date(t.food_issued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : !isCheckedIn ? (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warn)', fontWeight: 600 }}>
                          <AlertTriangle size={18} /> Not Checked In ⚠️
                        </div>
                      ) : !isEligible ? (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontWeight: 600 }}>
                          <AlertCircle size={18} /> Not Eligible ❌
                        </div>
                      ) : (
                        <button 
                          className="btn btn-accent" 
                          style={{ width: '100%', padding: '0.75rem' }}
                          disabled={processingId === t.id}
                          onClick={() => handleIssueCoupon(t)}
                        >
                          <Ticket size={18} /> {processingId === t.id ? "Processing..." : "Mark Coupon Distributed"}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
