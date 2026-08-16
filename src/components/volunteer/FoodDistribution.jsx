"use client";
import { useState, useEffect, useCallback } from "react";
import { searchTeams, distributeCoupon } from "@/app/volunteer/actions";
import { toast } from "sonner";
import { Search, CheckCircle, Ticket } from "lucide-react";

export default function FoodDistribution({ hackathons, packages }) {
  const [selectedHackathon, setSelectedHackathon] = useState(hackathons[0]?.id);
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchTeams = useCallback(async () => {
    if (!selectedHackathon) return;
    setLoading(true);
    const res = await searchTeams(selectedHackathon, query);
    if (res.error) {
      toast.error(res.error);
    } else {
      setTeams(res.teams || []);
    }
    setLoading(false);
  }, [selectedHackathon, query]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchTeams(); }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchTeams]);

  const handleIssueCoupon = async (team, pkg, amount, method) => {
    setProcessingId(team.id + pkg.id);
    const res = await distributeCoupon(team.id, selectedHackathon, pkg.id, method, amount);
    setProcessingId(null);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`${pkg.name} coupon issued to ${team.name}`);
      fetchTeams();
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="field" style={{ margin: 0, maxWidth: 300 }}>
          <label className="eyebrow">Active Event</label>
          <select className="input" value={selectedHackathon} onChange={e => setSelectedHackathon(e.target.value)}>
            {hackathons.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', marginBottom: '2rem' }}>
        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          className="input" 
          style={{ paddingLeft: 48, fontSize: '1.125rem', padding: '1.25rem 1rem 1.25rem 48px', borderRadius: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-focus)' }}
          placeholder="Search team name, ID, or phone..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && teams.length === 0 ? (
          <div className="text-center muted">Searching...</div>
        ) : teams.length === 0 ? (
          <div className="empty">No teams found.</div>
        ) : (
          teams.map(t => {
            const isCheckedIn = t.status === "Checked-In";
            return (
              <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: isCheckedIn ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem 0' }}>{t.name} <span className="muted text-sm mono">#{t.team_code}</span></h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${isCheckedIn ? 'badge-active' : ''}`}>{t.status}</span>
                      {isCheckedIn && <span className="badge">Team {t.team_number}</span>}
                    </div>
                  </div>
                </div>

                {!isCheckedIn && <div className="muted text-sm" style={{ color: 'var(--warn)' }}>Team must be checked in to receive coupons.</div>}

                {isCheckedIn && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {packages.map(pkg => {
                      const issued = t.coupon_distributions?.find(d => d.package_id === pkg.id);
                      if (issued) {
                        return (
                          <div key={pkg.id} style={{ padding: '1rem', background: 'var(--success-soft)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div className="flex-between">
                              <span style={{ fontWeight: 600, color: 'var(--success)' }}>{pkg.name}</span>
                              <CheckCircle size={18} color="var(--success)" />
                            </div>
                            <div className="muted text-xs" style={{ marginTop: 4 }}>Issued</div>
                          </div>
                        );
                      }
                      return (
                        <div key={pkg.id} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{pkg.name}</div>
                          <div className="muted text-sm" style={{ marginBottom: 12 }}>{pkg.price > 0 ? `₹${pkg.price}` : 'Prepaid/Included'}</div>
                          
                          <button 
                            className="btn btn-accent btn-sm" 
                            style={{ width: '100%' }}
                            disabled={processingId === (t.id + pkg.id)}
                            onClick={() => {
                              if (pkg.price > 0) {
                                const method = prompt("Enter payment method (Cash/UPI/Card):", "UPI");
                                if (method) handleIssueCoupon(t, pkg, pkg.price, method);
                              } else {
                                handleIssueCoupon(t, pkg, 0, 'Prepaid');
                              }
                            }}
                          >
                            <Ticket size={14} /> Issue Coupon
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
