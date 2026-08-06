import React from "react";
import { BellRing } from "lucide-react";
import { buildRadarAlerts } from "@/lib/safetyFeatures";

export default function CommunityAlertsPanel({ scans, reports }) {
  const alerts = buildRadarAlerts(scans, reports);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-risk/10 text-risk">
          <BellRing className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold font-heading">Community scam alerts</h3>
          <p className="text-sm text-muted-foreground">Repeated companies and scam labels that need attention.</p>
        </div>
      </div>

      {alerts.length ? (
        <div className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <div key={alert.label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{alert.label}</p>
                <p className="text-xs text-muted-foreground">{alert.type}</p>
              </div>
              <span className="rounded-full bg-risk/10 px-2.5 py-1 text-xs font-semibold text-risk">
                {alert.count} hits
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
          No repeated alert pattern yet. New scans and reports will surface here automatically.
        </p>
      )}
    </section>
  );
}
