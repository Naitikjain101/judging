"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addTeam, deleteTeam, editTeam } from "@/app/organizer/hackathons/actions";
import CsvImportTeams from "./CsvImportTeams";
import TeamModal from "./TeamModal";
import TeamViewModal from "./TeamViewModal";
import { Search, Download, Plus, Trash2, Edit } from "lucide-react";

export default function TeamsPanel({ hackathonId, teams }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [viewingTeam, setViewingTeam] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [foodFilter, setFoodFilter] = useState("All");

  async function handleModalSubmit(formData) {
    if (editingTeam) {
      const res = await editTeam(hackathonId, editingTeam.id, formData);
      if (res?.error) throw new Error(res.error);
    } else {
      const res = await addTeam(hackathonId, formData);
      if (res?.error) throw new Error(res.error);
    }
    setIsModalOpen(false);
    setEditingTeam(null);
    router.refresh();
  }

  const handleDelete = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    const res = await deleteTeam(hackathonId, teamId);
    if (res?.error) setError(res.error);
    else router.refresh();
  };

  const handleExportCSV = () => {
    if (!teams?.length) return;
    const headers = ["Team Name", "Registration ID", "Track", "Leader", "Email", "Phone", "Status", "Food Package", "Table Number"];
    const csvRows = [headers.join(",")];
    
    teams.forEach(t => {
      const row = [
        `"${t.name || ""}"`,
        `"${t.team_code || ""}"`,
        `"${t.leader_name || ""}"`,
        `"${t.email || ""}"`,
        `"${t.phone || ""}"`,
        `"${t.status || "Registered"}"`,
        `"${t.team_number || ""}"`,
        `"${t.table_number || ""}"`
      ];
      csvRows.push(row.join(","));
    });
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teams_export.csv`;
    a.click();
  };

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    return teams.filter(t => {
      const matchesSearch = !searchQuery || 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.team_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.leader_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesTrack = trackFilter === "All" || t.track === trackFilter;
      const matchesStatus = statusFilter === "All" || (t.status || "Registered") === statusFilter;
      const matchesFood = foodFilter === "All" || 
        (foodFilter === "Yes" && t.food_purchased) || 
        (foodFilter === "No" && !t.food_purchased);
        
      return matchesSearch && matchesTrack && matchesStatus && matchesFood;
    });
  }, [teams, searchQuery, trackFilter, statusFilter, foodFilter]);

  // Extract unique tracks for filter dropdown
  const uniqueTracks = useMemo(() => {
    const tracks = new Set();
    teams?.forEach(t => { if (t.track) tracks.add(t.track); });
    return Array.from(tracks);
  }, [teams]);

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      
      {/* Top Toolbar */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => { setEditingTeam(null); setIsModalOpen(true); }}>
              <Plus size={16} /> Add Team
            </button>
            <CsvImportTeams hackathonId={hackathonId} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }} />
            <input 
              type="search" 
              className="input" 
              placeholder="Search by Name, Reg ID, Leader..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          
          <select className="input" value={trackFilter} onChange={e => setTrackFilter(e.target.value)}>
            <option value="All">All Tracks</option>
            {uniqueTracks.map(track => (
              <option key={track} value={track}>{track}</option>
            ))}
          </select>
          
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Registered">Registered</option>
            <option value="Partially Checked In">Partially Checked In</option>
            <option value="Checked-In">Checked-In</option>
            <option value="Absent">Absent</option>
            <option value="Judging">Judging</option>
            <option value="Completed">Completed</option>
          </select>
          
          <select className="input" value={foodFilter} onChange={e => setFoodFilter(e.target.value)}>
            <option value="All">Food Status</option>
            <option value="Yes">Purchased</option>
            <option value="No">Not Purchased</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Leader</th>
              <th>Members Present</th>
              <th>Status</th>
              <th>Team Number</th>
              <th>Table Number</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!filteredTeams?.length ? (
              <tr>
                <td colSpan="8" className="text-center muted" style={{ padding: '2rem' }}>No teams match your filters.</td>
              </tr>
            ) : (
              filteredTeams.map((t) => {
                let parsedMembers = [];
                try {
                  parsedMembers = JSON.parse(t.members || "[]");
                } catch(e) {}
                const presentCount = parsedMembers.filter(m => m.status === 'Present').length;
                const totalCount = parsedMembers.length;
                
                let statusColor = '';
                if (t.status === 'Checked-In') statusColor = 'badge-active';
                else if (t.status === 'Partially Checked In') statusColor = 'badge-warning';
                else if (t.status === 'Absent') statusColor = 'badge-error';
                else if (t.status === 'Judging') statusColor = 'badge-info';
                else if (t.status === 'Completed') statusColor = 'badge-success';

                return (
                <tr key={t.id} onClick={() => setViewingTeam(t)} style={{ cursor: 'pointer' }} className="hover-row">
                  <td>
                    <div style={{ fontWeight: 500 }}>{t.name}</div>
                    <div className="muted text-xs mono">{t.team_code}</div>
                  </td>
                  <td>{t.leader_name || <span className="muted">-</span>}</td>
                  <td className="mono text-sm">{totalCount > 0 ? `${presentCount} / ${totalCount}` : '-'}</td>
                  <td>
                    <span className={`badge ${statusColor}`}>
                      {t.status || 'Registered'}
                    </span>
                  </td>
                  <td className="mono">{t.team_number || '-'}</td>
                  <td className="mono">{t.table_number || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        title="Edit"
                        onClick={(e) => { e.stopPropagation(); setEditingTeam(t); setIsModalOpen(true); }}
                        style={{ padding: '0.5rem' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                        style={{ padding: '0.5rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            }))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <TeamModal 
          hackathonId={hackathonId}
          initialData={editingTeam}
          onClose={() => { setIsModalOpen(false); setEditingTeam(null); }}
          onSubmit={handleModalSubmit}
        />
      )}

      {viewingTeam && (
        <TeamViewModal 
          team={viewingTeam}
          onClose={() => setViewingTeam(null)}
        />
      )}
    </div>
  );
}
