import React from "react";
import { CheckCircle2, CircleAlert, CircleHelp, Network } from "lucide-react";
import { buildCompanyTrustGraph } from "@/lib/safetyFeatures";
import { cn } from "@/lib/utils";

const style = {
  pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  fail: "border-risk/30 bg-risk/10 text-risk"
};

const icons = {
  pass: CheckCircle2,
  warn: CircleHelp,
  fail: CircleAlert
};

export default function CompanyTrustGraph({ scan }) {
  const graph = buildCompanyTrustGraph(scan);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Network className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold font-heading">Company trust graph</h2>
            <p className="text-sm text-muted-foreground">{graph.verdict}</p>
          </div>
        </div>
        <div className="w-full sm:w-40">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Trust score</span>
            <span>{graph.score}/100</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${graph.score}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {graph.nodes.map((node) => {
          const Icon = icons[node.status];
          return (
            <div key={node.label} className={cn("rounded-xl border p-3", style[node.status])}>
              <Icon className="h-4 w-4" />
              <p className="mt-2 text-sm font-semibold">{node.label}</p>
              <p className="mt-1 break-words text-xs opacity-80">{node.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
