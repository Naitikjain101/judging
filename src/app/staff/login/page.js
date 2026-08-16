import TerminalPath from "@/components/TerminalPath";
import StaffLoginForm from "@/components/staff/StaffLoginForm";

export default function StaffLoginPage() {
  return (
    <div className="shell">
      <div className="page-narrow" style={{ paddingTop: 60 }}>
        <TerminalPath segments={["staff", "login"]} />
        <h1 className="title" style={{ marginBottom: 24 }}>
          Staff login
        </h1>

        <div className="card">
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Sign in with the staff code and password provided by the organizer to access your dashboard.
          </p>

          <StaffLoginForm />
        </div>
      </div>
    </div>
  );
}
