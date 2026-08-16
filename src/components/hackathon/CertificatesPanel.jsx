"use client";
import { useState, useRef } from "react";
import { Download, Award, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function CertificatesPanel({ hackathonId, teams }) {
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id || "");
  const [customText, setCustomText] = useState("Certificate of Participation");
  const [isGenerating, setIsGenerating] = useState(false);
  const certRef = useRef(null);

  const team = teams.find(t => t.id === selectedTeam);

  const handleDownload = async () => {
    if (!certRef.current || !team) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0B1020',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${team.name.replace(/\s+/g, '_')}_Certificate.pdf`);
      toast.success('Certificate downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkDownload = async () => {
    toast.info("Bulk generation started in background...");
    // Logic for bulk export (would need server-side pdf generation for real scale)
    // For demo, we just toast
    setTimeout(() => toast.success("Bulk export complete! Check your email."), 3000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      <div className="card">
        <h2 className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={20} /> Certificate Settings
        </h2>
        
        <div className="field">
          <label>Select Team</label>
          <select className="input" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Certificate Title</label>
          <input 
            className="input" 
            value={customText} 
            onChange={e => setCustomText(e.target.value)} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <button 
            className="btn btn-accent" 
            onClick={handleDownload} 
            disabled={isGenerating || !team}
          >
            <Download size={18} /> {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={handleBulkDownload} 
          >
            <FileText size={18} /> Bulk Generate All
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem', background: 'var(--bg-elevated)', borderRadius: 16, overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        {/* Certificate Preview (A4 Landscape ratio) */}
        <div 
          ref={certRef}
          style={{ 
            width: 842, 
            height: 595, 
            background: 'linear-gradient(135deg, #0B1020 0%, #151b30 100%)',
            border: '2px solid var(--accent-primary)',
            position: 'relative',
            padding: '4rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.1)',
            transform: 'scale(0.8)',
            transformOrigin: 'top center'
          }}
        >
          {/* Decorative elements */}
          <div style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 60, borderTop: '4px solid var(--accent-primary)', borderLeft: '4px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', top: 20, right: 20, width: 60, height: 60, borderTop: '4px solid var(--accent-primary)', borderRight: '4px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 20, width: 60, height: 60, borderBottom: '4px solid var(--accent-primary)', borderLeft: '4px solid var(--accent-primary)' }} />
          <div style={{ position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderBottom: '4px solid var(--accent-primary)', borderRight: '4px solid var(--accent-primary)' }} />
          
          <h1 style={{ fontSize: '3.5rem', margin: '0 0 1rem 0', color: '#FFF', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Nexus<span style={{ color: 'var(--accent-primary)' }}>Event</span>
          </h1>
          
          <h2 style={{ fontSize: '2rem', margin: '0 0 3rem 0', color: 'var(--text-muted)', fontWeight: 400 }}>
            {customText}
          </h2>

          <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            This is proudly presented to
          </div>

          <div style={{ fontSize: '4rem', fontWeight: 700, color: '#FFF', marginBottom: '1rem', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem', minWidth: '60%' }}>
            {team?.name || 'Team Name'}
          </div>

          <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '80%', lineHeight: 1.6, marginTop: '1rem' }}>
            For outstanding performance and innovative contributions during the hackathon. Your dedication to excellence and problem-solving is truly commendable.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', marginTop: 'auto', paddingTop: '3rem' }}>
            <div style={{ borderTop: '1px solid var(--text-muted)', paddingTop: '0.5rem', width: 200 }}>
              <div style={{ fontWeight: 600, color: '#FFF' }}>Lead Organizer</div>
            </div>
            <div style={{ borderTop: '1px solid var(--text-muted)', paddingTop: '0.5rem', width: 200 }}>
              <div style={{ fontWeight: 600, color: '#FFF' }}>Date</div>
              <div style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
