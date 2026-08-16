"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Calendar, Activity, CheckCircle, ChevronRight } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";

export default function HackathonList({ initialHackathons, createAction }) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = initialHackathons.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    (h.description && h.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "active": return <Activity size={14} />;
      case "completed": return <CheckCircle size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            className="input" 
            style={{ paddingLeft: 40 }}
            placeholder="Search hackathons..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-accent" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={18} /> New Event
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: '2rem' }}
          >
            <div className="card">
              <h2 className="subtitle" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create Hackathon</h2>
              <form action={createAction}>
                <div className="field">
                  <label htmlFor="name">Name</label>
                  <input className="input" id="name" name="name" required placeholder="e.g. Winter Hack 2026" />
                </div>
                <div className="field">
                  <label htmlFor="description">Description</label>
                  <textarea className="textarea" id="description" name="description" placeholder="What's this event about?" />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <SubmitButton pendingText="Creating…">Create</SubmitButton>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!filtered.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty">
          {search ? "No hackathons match your search." : "No hackathons yet. Create one to get started."}
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <AnimatePresence>
          {filtered.map((h, i) => (
            <motion.div 
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/organizer/hackathons/${h.id}`} className="card card-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.125rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {h.name}
                    <span className={`badge ${h.status === "active" ? "badge-active" : h.status === "completed" ? "badge-warn" : ""}`}>
                      {getStatusIcon(h.status)} {h.status}
                    </span>
                  </h2>
                  {h.description && <p className="muted" style={{ fontSize: '0.875rem' }}>{h.description}</p>}
                </div>
                <ChevronRight size={20} className="muted" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
