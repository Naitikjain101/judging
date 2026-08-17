"use client";
import { useState, useEffect, useCallback } from "react";
import { searchTeams, distributeCoupon } from "@/app/volunteer/actions";
import { toast } from "sonner";
import { Search, CheckCircle, Ticket, X } from "lucide-react";

/**
 * Food distribution panel — auto-scoped to a single hackathon.
 * Shows team search, package selection, payment method picker,
 * and coupon issuance with duplicate prevention.
 */
export default function FoodDistribution({ hackathon, packages }) {
  const hackathonId = hackathon.id;
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Payment dialog state
  const [paymentDialog, setPaymentDialog] = useState(null); // { team, pkg }
  const [paymentMethod, setPaymentMethod] = useState("UPI");

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

  const handleIssueCoupon = async (team, pkg, amount, method) => {
    const key = team.id + pkg.id;
    setProcessingId(key);
    const res = await distributeCoupon(team.id, hackathonId, pkg.id, method, amount);
    setProcessingId(null);
    setPaymentDialog(null);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`${pkg.name} coupon issued to ${team.name}`);
      fetchTeams();
    }
  };

  const handlePackageClick = (team, pkg) => {
    if (pkg.price > 0) {
      // Show payment method dialog
      setPaymentDialog({ team, pkg });
      setPaymentMethod("UPI");
    } else {
      handleIssueCoupon(team, pkg, 0, "Prepaid");
    }
  };

  return (
    <div>
      {/* Search */}
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
                            <div className="muted text-xs" style={{ marginTop: 4 }}>
                              Issued {new Date(issued.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
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
                            onClick={() => handlePackageClick(t, pkg)}
                          >
                            <Ticket size={14} /> {processingId === (t.id + pkg.id) ? "Issuing..." : "Issue Coupon"}
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

      {/* Payment Method Dialog */}
      {paymentDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Payment Method</h3>
              <button onClick={() => setPaymentDialog(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div className="muted text-sm" style={{ marginBottom: 8 }}>
                <strong>{paymentDialog.pkg.name}</strong> for <strong>{paymentDialog.team.name}</strong>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                ₹{paymentDialog.pkg.price}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {["Cash", "UPI", "Card"].map(method => (
                <label key={method} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                  border: `2px solid ${paymentMethod === method ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  borderRadius: 12, cursor: 'pointer',
                  background: paymentMethod === method ? 'var(--accent-soft)' : 'transparent',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontWeight: 500, fontSize: '1.1rem' }}>{method}</span>
                </label>
              ))}
            </div>

            <button 
              className="btn btn-accent" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              disabled={processingId === (paymentDialog.team.id + paymentDialog.pkg.id)}
              onClick={() => handleIssueCoupon(paymentDialog.team, paymentDialog.pkg, paymentDialog.pkg.price, paymentMethod)}
            >
              {processingId === (paymentDialog.team.id + paymentDialog.pkg.id) ? "Processing..." : `Confirm ${paymentMethod} Payment & Issue`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
