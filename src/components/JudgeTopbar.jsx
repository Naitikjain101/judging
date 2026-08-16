import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

export default function JudgeTopbar({ judgeName, company }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link href="/judge/dashboard" className="brand" style={{ letterSpacing: '-0.02em' }}>
          <span className="dot" style={{ width: 12, height: 12, background: 'var(--accent-primary)', boxShadow: '0 0 15px var(--accent-primary)' }} />
          Nexus<span style={{ color: 'var(--text-muted)' }}>Event</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {company && <span className="muted text-sm" style={{ display: "none" }} >{company}</span>}
          {judgeName && <ProfileMenu label={judgeName + (company ? ` (${company})` : "")} loginPath="/" />}
        </div>
      </div>
    </div>
  );
}
