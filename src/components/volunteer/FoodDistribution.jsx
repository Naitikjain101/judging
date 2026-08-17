"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { searchTeams, issueMemberCoupon, collectPayment } from "@/app/volunteer/actions";
import { toast } from "sonner";
import { Search, CheckCircle, Ticket, AlertTriangle, AlertCircle, User, CreditCard } from "lucide-react";

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

  const handleIssueCoupon = async (teamId, memberIndex) => {
    setProcessingId(`${teamId}-${memberIndex}`);
    const res = await issueMemberCoupon(teamId, hackathonId, memberIndex);
    setProcessingId(null);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Coupon distributed successfully!");
      fetchTeams();
    }
  };

  const handleCollectPayment = async (team) => {
    if (!confirm(`Confirm payment collected for team ${team.name}?`)) return;
    setProcessingId(`payment-${team.id}`);
    const res = await collectPayment(team.id, hackathonId);
    setProcessingId(null);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Payment collected! Team ${team.name} is now eligible for food.`);
      fetchTeams();
    }
  };

  const stats = useMemo(() => {
    let eligibleCoupons = 0;
    let distributedCoupons = 0;
    
    teams.forEach(t => {
      if (t.food_purchased && t.food_payment_status === "Paid") {
        let members = [];
        try { members = JSON.parse(t.members || "[]"); } catch(e) {}
        
        members.forEach(m => {
          if (m.status === 'Present') {
            eligibleCoupons++;
            if (m.food_issued) distributedCoupons++;
          }
        });
      }
    });

    return {
      eligible: eligibleCoupons,
      distributed: distributedCoupons,
      remaining: Math.max(0, eligibleCoupons - distributedCoupons),
      notCheckedIn: teams.filter(t => t.status === "Registered").length,
    };
  }, [teams]);

  return (
    <div>
      {/* Counters */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '3rem', flex: 1, justifyContent: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big">{stats.eligible}</div>
            <div className="eyebrow">Eligible Coupons</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--success)' }}>{stats.distributed}</div>
            <div className="eyebrow">Distributed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--accent-primary)' }}>{stats.remaining}</div>
            <div className="eyebrow">Remaining</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="score-big" style={{ color: 'var(--warn)' }}>{stats.notCheckedIn}</div>
            <div className="eyebrow">Teams Not Checked In</div>
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
            let members = [];
            try { members = JSON.parse(t.members || "[]"); } catch(e) {}
            
            const presentCount = members.filter(m => m.status === 'Present').length;
            const totalCount = members.length;
            const isFullyCheckedIn = t.status === "Checked-In";
            const isPartiallyCheckedIn = t.status === "Partially Checked In";
            const isPaid = t.food_purchased && t.food_payment_status === "Paid";
            const isUnpaid = t.food_purchased && t.food_payment_status === "Unpaid";
            const notIncluded = !t.food_purchased;
            
            let couponsAvailable = 0;
            let couponsDistributed = 0;
            
            if (isPaid) {
              members.forEach(m => {
                if (m.status === 'Present') {
                  if (m.food_issued) couponsDistributed++;
                  else couponsAvailable++;
                }
              });
            }

            return (
              <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: (isFullyCheckedIn || isPartiallyCheckedIn) ? 1 : 0.7 }}>
                
                {/* Team Header & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {t.name}
                      <span className="muted text-sm mono">#{t.team_code}</span>
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {/* Check-In Badge */}
                      {isFullyCheckedIn ? (
                        <span className="badge badge-active">Fully Checked In</span>
                      ) : isPartiallyCheckedIn ? (
                        <span className="badge badge-warning">{presentCount} / {totalCount} Checked In</span>
                      ) : (
                        <span className="badge badge-error">Not Checked In</span>
                      )}

                      {/* Food Payment Badge */}
                      {notIncluded ? (
                        <span className="badge badge-default">Food Not Included</span>
                      ) : isPaid ? (
                        <span className="badge badge-active">Food Paid ✅</span>
                      ) : (
                        <span className="badge badge-warning">Food Unpaid</span>
                      )}
                      
                      {/* Coupon Counts */}
                      {isPaid && (
                        <span className="badge badge-default" style={{ fontWeight: 600 }}>
                          {couponsAvailable} Available · {couponsDistributed} Distributed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Collection Action */}
                  {isUnpaid && (
                    <div style={{ minWidth: '200px' }}>
                      <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '0.5rem', color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} /> Food Payment Required
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '0.75rem' }}
                        disabled={processingId === `payment-${t.id}`}
                        onClick={() => handleCollectPayment(t)}
                      >
                        <CreditCard size={18} /> {processingId === `payment-${t.id}` ? "Processing..." : "Collect Payment & Activate"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Member Coupon List */}
                {isPaid && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Member Coupons</div>
                    
                    {members.length === 0 ? (
                      <div className="muted text-sm">No members found.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {members.map((m, index) => {
                          const isPresent = m.status === 'Present';
                          const isIssued = m.food_issued;
                          
                          return (
                            <div key={index} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem',
                              border: `1px solid ${isIssued ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                              background: isIssued ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-elevated)',
                              borderRadius: 8,
                              opacity: isPresent ? 1 : 0.6
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ background: isPresent ? 'var(--accent-primary)' : 'var(--bg)', color: isPresent ? '#fff' : 'var(--text-muted)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <User size={16} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 500 }}>{m.name}</div>
                                  <div className="text-xs muted">{isPresent ? "Checked In" : "Not Checked In"}</div>
                                </div>
                              </div>
                              
                              <div>
                                {!isPresent ? (
                                  <span className="badge text-xs" style={{ background: 'transparent' }}>Not Eligible</span>
                                ) : isIssued ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
                                    <CheckCircle size={16} /> Given ✅
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-accent" 
                                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                    disabled={processingId === `${t.id}-${index}`}
                                    onClick={() => handleIssueCoupon(t.id, index)}
                                  >
                                    <Ticket size={16} /> Give Coupon
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
