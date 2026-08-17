"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TeamsPanel from "./TeamsPanel";
import JudgesPanel from "./JudgesPanel";
import RoundsPanel from "./RoundsPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import StaffPanel from "./StaffPanel";
import SettingsPanel from "./SettingsPanel";

const TABS = [
  { key: "analytics", label: "analytics" },
  { key: "teams", label: "teams" },
  { key: "judges", label: "judges" },
  { key: "staff", label: "staff" },
  { key: "rounds", label: "rounds" },
  { key: "settings", label: "settings" },
];

export default function HackathonTabs({ hackathonId, hackathon, teams, judges, rounds, packages, purchases, distributions, staff }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const tabParam = searchParams.get("tab");
  const [active, setActive] = useState(tabParam || "analytics");

  // Sync state to URL without full navigation
  const handleTabChange = (key) => {
    setActive(key);
    const params = new URLSearchParams(searchParams);
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Sync state if URL changes externally
  useEffect(() => {
    if (tabParam && tabParam !== active) {
      setActive(tabParam);
    }
  }, [tabParam]);

  return (
    <div>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${active === t.key ? "active" : ""}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label} 
            {t.key === "teams" ? ` (${teams.length})` : 
             t.key === "judges" ? ` (${judges.length})` : 
             t.key === "staff" ? ` (${staff?.length || 0})` : 
             t.key === "rounds" ? ` (${rounds.length})` : ""}
          </button>
        ))}
      </div>

      {active === "analytics" && <AnalyticsPanel teams={teams} packages={packages} purchases={purchases} distributions={distributions} />}
      {active === "teams" && <TeamsPanel hackathonId={hackathonId} teams={teams} />}
      {active === "judges" && <JudgesPanel hackathonId={hackathonId} judges={judges} />}
      {active === "staff" && <StaffPanel hackathonId={hackathonId} staff={staff || []} />}
      {active === "rounds" && <RoundsPanel hackathonId={hackathonId} rounds={rounds} />}
      {active === "settings" && <SettingsPanel hackathon={hackathon} />}
    </div>
  );
}
