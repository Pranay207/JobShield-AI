import React from "react";
import { MapPin, Clock } from "lucide-react";

export default function RecentReports({ reports = [] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No reports yet.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-risk/10 px-2.5 py-1 text-xs font-semibold text-risk">
              {r.scam_type}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(r.created_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
          <p className="mt-2 text-sm text-foreground">{r.description}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {r.company_name && <span>· {r.company_name}</span>}
            {r.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
            {r.channel && <span>· via {r.channel}</span>}
            {r.amount_demanded > 0 && <span>· asked ₹{r.amount_demanded.toLocaleString("en-IN")}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}