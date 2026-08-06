import React from "react";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const sevConfig = {
  high: { icon: ShieldAlert, badge: "bg-risk/15 text-risk", label: "High" },
  medium: { icon: AlertTriangle, badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "Medium" },
  low: { icon: Info, badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400", label: "Low" }
};

export default function RedFlagsList({ redFlags = [] }) {
  if (!redFlags.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No specific red flags were detected by the AI analysis.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {redFlags.map((flag, i) => {
        const sev = sevConfig[flag.severity] || sevConfig.low;
        const Icon = sev.icon;
        return (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", sev.badge)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold font-heading">{flag.title || flag.type}</h4>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", sev.badge)}>{sev.label}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{flag.description}</p>
                {flag.evidence && (
                  <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs italic text-muted-foreground">
                    “{flag.evidence}”
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}