import { createPortalClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

export default async function VolunteerLayout({ children }) {
  const supabase = await createPortalClient("volunteer");
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) redirect("/staff/login");

  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-inner">
          <Link href="/volunteer" className="brand" style={{ letterSpacing: '-0.02em' }}>
            <span className="dot" style={{ width: 12, height: 12, background: 'var(--warn)', boxShadow: '0 0 15px var(--warn)' }} />
            Nexus<span style={{ color: 'var(--text-muted)' }}>Volunteer</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ProfileMenu label={userData.user.user_metadata?.staff_code || userData.user.email} loginPath="/staff/login" portal="volunteer" />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
