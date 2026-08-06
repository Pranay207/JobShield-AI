import React from "react";
import { Building2, CheckCircle2, XCircle, HelpCircle, Globe, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

function statusBadge(value) {
  const positive = ["Verified", "Legitimate", "Clear"];
  const negative = ["Not Found", "Suspicious", "Flagged"];
  if (!value) return { icon: HelpCircle, cls: "bg-muted text-muted-foreground", label: "Uncertain" };
  if (positive.includes(value)) return { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", label: value };
  if (negative.includes(value)) return { icon: XCircle, cls: "bg-risk/15 text-risk", label: value };
  return { icon: HelpCircle, cls: "bg-muted text-muted-foreground", label: value };
}

function Row({ label, value }) {
  const s = statusBadge(value);
  const Icon = s.icon;
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", s.cls)}>
        <Icon className="h-3.5 w-3.5" />
        {s.label}
      </span>
    </div>
  );
}

export default function CompanyVerificationCard({ companyName, verification }) {
  const verified = verification?.is_verified;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold font-heading">Company verification</h3>
          <p className="text-sm text-muted-foreground">{companyName || "No company name detected in the offer"}</p>
        </div>
        {verification && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:ml-auto",
              verified ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-risk/15 text-risk"
            )}
          >
            {verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {verified ? "Looks verified" : "Unverified"}
          </span>
        )}
      </div>

      {!verification ? (
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          No company could be extracted from this offer, so verification was skipped.
        </p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Row label="MCA registry" value={verification.mca_status} />
          <Row label="GST presence" value={verification.gst_status} />
          <Row label="Official domain" value={verification.domain_check} />
          <Row label="Blacklist check" value={verification.blacklist_check} />
        </div>
      )}

      {verification?.notes && (
        <p className="mt-3 text-sm text-muted-foreground">{verification.notes}</p>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Company checks use public web signals and available verification clues.</span>
      </div>
    </div>
  );
}

