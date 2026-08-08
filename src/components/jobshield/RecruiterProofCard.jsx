import React from "react";
import { BadgeCheck, CircleAlert, CircleHelp, ShieldQuestion, UserCheck } from "lucide-react";
import { buildRecruiterProof } from "@/lib/recruiterProof";
import { cn } from "@/lib/utils";

const tone = {
  pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  fail: "border-risk/30 bg-risk/10 text-risk"
};

const icon = {
  pass: BadgeCheck,
  warn: CircleHelp,
  fail: CircleAlert
};

export default function RecruiterProofCard({ scan }) {
  const proof = buildRecruiterProof(scan);
  const scoreTone = proof.score >= 75
    ? "text-emerald-600"
    : proof.score >= 45
      ? "text-amber-600 dark:text-amber-300"
      : "text-risk";

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold font-heading">Recruiter Proof Score</h2>
            <p className="text-sm text-muted-foreground">Evidence-based proof that the recruiter can represent the claimed company.</p>
          </div>
        </div>
        <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-bold", proof.score >= 75 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : proof.score >= 45 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-risk/15 text-risk")}>
          {proof.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-end gap-2">
            <span className={cn("text-4xl font-extrabold font-heading", scoreTone)}>{Math.round(proof.score)}</span>
            <span className="pb-1 text-sm font-semibold text-muted-foreground">/100</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${proof.score}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Company: {proof.companyName || "not clearly identified"}
          </p>
          {proof.penalty > 0 && (
            <p className="mt-2 rounded-lg bg-risk/10 px-2 py-1 text-xs text-risk">Urgency penalty applied</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {proof.checks.map((check) => {
            const Icon = icon[check.status] || ShieldQuestion;
            return (
              <div key={check.label} className={cn("rounded-xl border p-3", tone[check.status] || tone.warn)}>
                <Icon className="h-4 w-4" />
                <p className="mt-2 text-sm font-bold">{check.label}</p>
                <p className="mt-1 text-xs leading-5 opacity-85">{check.detail}</p>
                {check.evidence && <p className="mt-2 break-words rounded-lg bg-background/50 px-2 py-1 text-[11px] opacity-80">{check.evidence}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
        <strong className="text-foreground">Next step:</strong> {proof.nextStep}
      </p>
    </section>
  );
}
