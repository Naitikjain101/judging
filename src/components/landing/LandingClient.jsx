'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Zap, Users, LayoutDashboard, ChevronRight, CheckCircle2, Ticket, Award } from "lucide-react";

export default function LandingClient() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="shell" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Background glow effects */}
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '80vh', background: 'radial-gradient(ellipse at top, rgba(0, 240, 255, 0.15), transparent 70%)', pointerEvents: 'none', zIndex: -1 }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vh', background: 'radial-gradient(ellipse at bottom right, rgba(0, 195, 255, 0.1), transparent 70%)', pointerEvents: 'none', zIndex: -1 }}></div>

      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
        <div className="brand" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          <span className="dot" style={{ width: 12, height: 12, background: 'var(--accent-primary)', boxShadow: '0 0 15px var(--accent-primary)' }}></span>
          Nexus<span style={{ color: 'var(--text-muted)' }}>Event</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/organizer/login" className="btn btn-accent btn-sm">Organizer Login</Link>
          <Link href="/judge/login" className="btn btn-secondary btn-sm" style={{ backdropFilter: 'blur(10px)' }}>Judge Portal</Link>
          <Link href="/staff/login" className="btn btn-secondary btn-sm" style={{ backdropFilter: 'blur(10px)' }}>Staff Login</Link>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        
        {/* Hero Section */}
        <motion.section 
          className="page" 
          style={{ textAlign: 'center', paddingTop: '8rem', paddingBottom: '6rem', maxWidth: 900 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0, 240, 255, 0.05)', padding: '8px 16px', borderRadius: 100, border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-primary)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)' }}>
            <Zap size={16} fill="currentColor" /> Enterprise Event Engine 2.0
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="title" style={{ fontSize: 'clamp(3.5rem, 8vw, 5.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: '2rem', marginBottom: '1.5rem' }}>
            Run hackathons with <br /> <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>surgical precision.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="muted" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', maxWidth: 650, margin: '0 auto 3rem', lineHeight: 1.6 }}>
            The complete lifecycle management platform for massive hackathons. From QR check-ins and food coupons to real-time judging leaderboards.
          </motion.p>
          
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/organizer/login" className="btn btn-accent" style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '100px' }}>
              Launch Dashboard <ChevronRight size={18} />
            </Link>
            <Link href="/judge/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '100px', backdropFilter: 'blur(10px)' }}>
              Judge Access
            </Link>
            <Link href="/staff/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem', borderRadius: '100px', backdropFilter: 'blur(10px)' }}>
              Staff Access
            </Link>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <section className="page" style={{ paddingTop: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-dim)' }}>
                <LayoutDashboard size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Real-time Command Center</h3>
              <p className="muted">Monitor check-ins, food distribution, and live leaderboards as they happen. Zero refresh required.</p>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-dim)' }}>
                <Ticket size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Automated Check-in</h3>
              <p className="muted">Lightning fast QR check-ins. Sequential table assignment algorithm prevents numbering gaps completely.</p>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-dim)' }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Advanced Judging Matrix</h3>
              <p className="muted">Weighted criteria, round-robin assignments, and instant result lock-in for perfect accuracy.</p>
            </motion.div>

          </div>
        </section>

        {/* Workflows */}
        <section className="page" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 className="title" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Scale to thousands without breaking a sweat.</h2>
            <p className="muted" style={{ maxWidth: 600, margin: '0 auto' }}>Role-based isolation ensures everyone only sees exactly what they need.</p>
          </div>
          
          <div className="card" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.05))' }}></div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', position: 'relative', zIndex: 1 }}>
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                  <Shield size={20} color="var(--accent-primary)" /> Organizers & Admins
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Role-based access control</li>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Bulk team and judge imports</li>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Custom scoring formulas</li>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Certificate and reporting engines</li>
                </ul>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
                  <Users size={20} color="var(--accent-primary)" /> Volunteers & Staff
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Dedicated Registration Desk UI</li>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Food package tracking</li>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Instant team search</li>
                  <li style={{ display: 'flex', gap: 8 }}><CheckCircle2 size={16} style={{ marginTop: 3, color: 'var(--success)' }} /> Coupon distribution logs</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', background: 'rgba(0,0,0,0.3)' }}>
        <p>&copy; {new Date().getFullYear()} NexusEvent Platform. Built for scale.</p>
      </footer>
    </div>
  );
}
