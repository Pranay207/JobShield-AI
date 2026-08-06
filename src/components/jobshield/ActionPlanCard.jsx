import React from "react";
import { ClipboardCheck, Flag, ShieldCheck } from "lucide-react";
import { buildActionPlan } from "@/lib/safetyFeatures";

const tone = {
  Now: "bg-risk/15 text-risk",
  Verify: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Report: "bg-primary/10 text-primary"
};

function iconFor(priority) {
  if (priority === "Now") return ShieldCheck;
  if (priority === "Report") return Flag;
  return ClipboardCheck;
}

export default function ActionPlanCard({ scan }) {
  const steps = buildActionPlan(scan);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold font-heading">Victim-safe action plan</h2>
          <p className="text-sm text-muted-foreground">Clear next steps without confrontation or risky payment.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {steps.map((step, index) => {
          const Icon = iconFor(step.priority);
          return (
            <div key={`${step.title}-${index}`} className="flex gap-3 rounded-xl border border-border bg-background p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone[step.priority] || tone.Verify}`}>
                    {step.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
