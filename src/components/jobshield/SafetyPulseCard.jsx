import React from "react";
import { ShieldCheck, ShieldAlert, ShieldX, HeartPulse } from "lucide-react";

function levelFor(score) {
  if (score >= 70) return { level: "High", color: "text-risk", ring: "text-risk", bg: "bg-risk/10", icon: ShieldX, label: "Elevated scam exposure" };
  if (score >= 40) return { level: "Medium", color: "text-amber-600 dark:text-amber-400", ring: "text-amber-500", bg: "bg-amber-500/10", icon: ShieldAlert, label: "Mixed — stay cautious" };
  return { level: "Low", color: "text-emerald-600 dark:text-emerald-400", ring: "text-emerald-500", bg: "bg-emerald-500/10", icon: ShieldCheck, label: "Looks safe overall" };
}

export default function SafetyPulseCard({ scans }) {
  const list = scans || [];
  const total = list.length;
  const avg = total ? Math.round(list.reduce((a, s) => a + (s.risk_score || 0), 0) / total) : 0;
  const high = list.filter((s) => s.risk_level === "High Risk").length;
  const meta = levelFor(avg);
  const Icon = total === 0 ? HeartPulse : meta.icon;

  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C - (Math.min(100, Math.max(0, avg)) / 100) * C;

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <HeartPulse className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold font-heading">Safety pulse</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Average risk across your {total} scan{total === 1 ? "" : "s"}.
      </p>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-32 w-32 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={R} className="fill-none stroke-muted" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r={R}
              className={`fill-none ${meta.ring} stroke-current`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extrabold font-heading ${meta.color}`}>{avg}</span>
            <span className="text-xs text-muted-foreground">avg / 100</span>
          </div>
        </div>

        <div className="flex-1">
          <div className={`inline-flex items-center gap-2 rounded-full ${meta.bg} px-3 py-1 text-sm font-medium ${meta.color}`}>
            <Icon className="h-4 w-4" />
            {meta.label}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {total === 0
              ? "Run your first scan to get a personalized safety pulse."
              : high > 0
                ? `${high} of your ${total} scan${total === 1 ? "" : "s"} came back high-risk — review them and avoid sharing documents or paying any upfront fee.`
                : `None of your scans came back high-risk. Keep verifying every offer before you trust it.`}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Scans" value={total} />
            <Stat label="High-risk" value={high} />
            <Stat label="Avg score" value={avg} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-lg font-bold font-heading">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}