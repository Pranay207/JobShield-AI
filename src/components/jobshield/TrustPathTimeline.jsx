import React from "react";
import { AlertTriangle, CheckCircle2, FileText, MessageCircle, ShieldAlert, UserRoundCheck, WalletCards } from "lucide-react";
import { buildTrustPath } from "@/lib/safetyFeatures";
import { cn } from "@/lib/utils";

const tone = {
  safe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  watch: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-risk/30 bg-risk/10 text-risk"
};

const icons = {
  contact: MessageCircle,
  recruiter: UserRoundCheck,
  offer: FileText,
  payment: WalletCards,
  documents: ShieldAlert,
  decision: CheckCircle2
};

export default function TrustPathTimeline({ scan }) {
  const path = buildTrustPath(scan);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold font-heading">TrustPath timeline</h2>
          <p className="text-sm text-muted-foreground">
            Shows where this job journey starts becoming risky, from first contact to final decision.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-6">
        {path.map((item, index) => {
          const Icon = icons[item.key] || AlertTriangle;
          return (
            <div key={item.key} className="relative">
              {index < path.length - 1 && (
                <span className="absolute left-6 top-6 hidden h-px w-[calc(100%+0.75rem)] bg-border md:block" />
              )}
              <div className="relative rounded-xl border border-border bg-background p-3 md:min-h-[150px]">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", tone[item.status])}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", tone[item.status])}>
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
        Stop point: if payment, private-chat pressure, or document collection appears before verified hiring, pause and verify independently.
      </p>
    </section>
  );
}