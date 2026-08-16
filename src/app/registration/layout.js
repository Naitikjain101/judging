import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu";

export default async function RegistrationLayout({ children }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) redirect("/organizer/login");

  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-inner">
          <Link href="/registration" className="brand" style={{ letterSpacing: '-0.02em' }}>
            <span className="dot" style={{ width: 12, height: 12, background: 'var(--success)', boxShadow: '0 0 15px var(--success)' }} />
            Nexus<span style={{ color: 'var(--text-muted)' }}>Registration</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ProfileMenu label={userData.user.email} loginPath="/" />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
