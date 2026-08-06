import React from "react";
import { cn } from "@/lib/utils";

const R = 56;
const C = 2 * Math.PI * R;

function colorFor(level) {
  if (!level) return "hsl(var(--muted-foreground))";
  if (level.startsWith("High")) return "hsl(0 72% 50%)";
  if (level.startsWith("Medium")) return "hsl(38 92% 45%)";
  return "hsl(152 56% 40%)";
}

export default function RiskScoreCard({ score = 0, level, summary }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = C - (clamped / 100) * C;
  const color = colorFor(level);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
        <svg className="h-40 w-40 -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold font-heading" style={{ color }}>
            {clamped}
          </span>
          <span className="text-xs font-medium text-muted-foreground">risk score</span>
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
            level?.startsWith("High") && "bg-risk/15 text-risk",
            level?.startsWith("Medium") && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
            level?.startsWith("Low") && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {level || "Unknown"}
        </span>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {summary || "No summary available."}
        </p>
      </div>
    </div>
  );
}