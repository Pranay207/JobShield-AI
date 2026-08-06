import React, { useEffect, useState } from "react";
import { BellRing, Loader2, RadioTower } from "lucide-react";
import { buildCommunityAlert } from "@/lib/safetyFeatures";
import { cn } from "@/lib/utils";

export default function CommunityAlertCard({ scan }) {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    let active = true;
    buildCommunityAlert(scan)
      .then((result) => { if (active) setAlert(result); })
      .catch(() => { if (active) setAlert({ alertLevel: "quiet", matches: [], matchCount: 0, headline: "No community alert yet" }); });
    return () => { active = false; };
  }, [scan]);

  if (!alert) {
    return (
      <section className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
        Checking community radar...
      </section>
    );
  }

  const active = alert.alertLevel === "active";
  const watch = alert.alertLevel === "watch";

  return (
    <section
      className={cn(
        "mt-8 rounded-2xl border p-5",
        active ? "border-risk/30 bg-risk/10" : watch ? "border-amber-500/30 bg-amber-500/10" : "border-border bg-card"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              active ? "bg-risk text-white" : watch ? "bg-amber-500 text-white" : "bg-primary/10 text-primary"
            )}
          >
            {active ? <BellRing className="h-5 w-5" /> : <RadioTower className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="text-lg font-bold font-heading">{alert.headline}</h2>
            <p className="text-sm text-muted-foreground">
              {alert.matchCount
                ? `${alert.matchCount} related signal${alert.matchCount === 1 ? "" : "s"} found across scans and reports.`
                : "This exact pattern has not appeared in your community intelligence yet."}
            </p>
          </div>
        </div>
      </div>

      {alert.matches.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {alert.matches.map((match, index) => (
            <div key={`${match.name}-${index}`} className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-sm font-semibold">{match.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{match.reasons.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
