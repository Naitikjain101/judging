import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

export default function OrganizerTopbar({ email }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link href="/organizer/dashboard" className="brand" style={{ letterSpacing: '-0.02em' }}>
          <span className="dot" style={{ width: 12, height: 12, background: 'var(--accent-primary)', boxShadow: '0 0 15px var(--accent-primary)' }} />
          Nexus<span style={{ color: 'var(--text-muted)' }}>Event</span>
        </Link>
        {email && <ProfileMenu label={email} loginPath="/" />}
      </div>
    </div>
  );
}
