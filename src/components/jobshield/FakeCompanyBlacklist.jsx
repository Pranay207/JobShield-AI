import React from "react";
import { Building2 } from "lucide-react";

export default function FakeCompanyBlacklist({ reports = [] }) {
  const counts = {};
  reports.forEach((r) => {
    const name = (r.company_name || "").trim();
    if (!name) return;
    counts[name] = (counts[name] || 0) + 1;
  });
  const sorted = Object.entries(counts).filter(([, c]) => c >= 1).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-risk" />
        <h3 className="text-base font-bold font-heading">Most-reported fake companies</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No company names reported yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sorted.map(([name, count]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-risk/30 bg-risk/10 px-3 py-1.5 text-xs font-medium text-risk"
            >
              {name}
              <span className="rounded-full bg-risk/20 px-1.5 text-[10px] font-bold">{count}×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}