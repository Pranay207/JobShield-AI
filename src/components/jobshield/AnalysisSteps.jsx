import React from "react";
import { FileSearch, BrainCircuit, Building2, Calculator, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { icon: FileSearch, label: "Extracting text" },
  { icon: BrainCircuit, label: "AI red-flag analysis" },
  { icon: Building2, label: "Verifying company" },
  { icon: Calculator, label: "Calculating risk score" }
];

export default function AnalysisSteps({ current = 0 }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-muted-foreground">Analyzing your offer…</h3>
      <div className="mt-5 space-y-4">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border",
                  done && "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className={cn("text-sm font-medium", active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/70")}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}