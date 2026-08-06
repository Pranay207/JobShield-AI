import React from "react";
import { TrendingUp } from "lucide-react";

const TYPE_COLORS = {
  "Upfront payment": "bg-risk/15 text-risk",
  "Fake company": "bg-orange-500/15 text-orange-600",
  "WhatsApp / Telegram scam": "bg-emerald-500/15 text-emerald-600",
  "Fake recruiter": "bg-violet-500/15 text-violet-600",
  "Document fraud": "bg-rose-500/15 text-rose-600",
  "Pyramid / referral scam": "bg-amber-500/15 text-amber-600",
  default: "bg-muted text-muted-foreground"
};

export default function TrendingPatterns({ reports = [] }) {
  const counts = {};
  reports.forEach((r) => {
    const t = r.scam_type || "Other";
    counts[t] = (counts[t] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted.length ? sorted[0][1] : 1;

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No community reports yet. Be the first to report a scam.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold font-heading">Trending scam types</h3>
      </div>
      <div className="space-y-3">
        {sorted.map(([type, count]) => {
          const tone = TYPE_COLORS[type] || TYPE_COLORS.default;
          const width = Math.max(8, (count / max) * 100);
          return (
            <div key={type}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{type}</span>
                <span className="text-muted-foreground">{count} report{count > 1 ? "s" : ""}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}