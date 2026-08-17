import LandingClient from "@/components/landing/LandingClient";

export default function Home() {
  // With portal-namespaced sessions, auto-redirecting from the root
  // is no longer deterministic (a browser might have active sessions
  // for Organizer, Judge, and Staff simultaneously).
  //
  // Users must explicitly click their desired portal login button.
  return <LandingClient />;
}
