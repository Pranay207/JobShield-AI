import React, { useEffect, useState } from "react";
import { Fingerprint, Loader2, Phone, Mail, IndianRupee, Building2, MessageSquareText, ShieldAlert, Database } from "lucide-react";
import { buildFingerprintIntel } from "@/lib/scamFingerprint";
import { cn } from "@/lib/utils";

const icons = {
  phone: Phone,
  email: Mail,
  upi: IndianRupee,
  company: Building2,
  template: MessageSquareText,
};

function scoreTone(score) {
  if (score >= 60) return { label: "Strong network signal", cls: "bg-risk/10 text-risk border-risk/30" };
  if (score >= 25) return { label: "Some related signals", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
  return { label: "No reuse found yet", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
}

export default function ScamFingerprintCard({ scan }) {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    buildFingerprintIntel(scan)
      .then((data) => { if (active) setIntel(data); })
      .catch(() => { if (active) setIntel({ signals: [], network_score: 0, compared_records: 0, fingerprint: scan.fingerprint || {} }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scan]);

  const tone = scoreTone(intel?.network_score || 0);
  const signals = intel?.signals || [];
  const fingerprint = intel?.fingerprint || scan.fingerprint || {};
  const extractedCount = [fingerprint.phones, fingerprint.emails, fingerprint.upi_ids, fingerprint.telegram_handles, fingerprint.domains, fingerprint.company_names]
    .reduce((sum, item) => sum + (item?.length || 0), 0);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Fingerprint className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold font-heading">Scam Fingerprint</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Checks contact details, payment handles, company names, and message patterns against your scam intelligence history.
            </p>
          </div>
        </div>
        <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", tone.cls)}>
          <ShieldAlert className="h-3.5 w-3.5" />
          {tone.label}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Building fingerprint intelligence...
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Network score</p>
              <p className="mt-1 text-2xl font-extrabold font-heading">{intel.network_score || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Records compared</p>
              <p className="mt-1 text-2xl font-extrabold font-heading">{intel.compared_records || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Identifiers found</p>
              <p className="mt-1 text-2xl font-extrabold font-heading">{extractedCount}</p>
            </div>
          </div>

          {signals.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {signals.map((signal) => {
                const Icon = icons[signal.type] || Fingerprint;
                return (
                  <div key={`${signal.type}-${signal.value}`} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{signal.label}</p>
                          {signal.count > 0 && <span className="rounded-full bg-risk/10 px-2 py-0.5 text-xs font-semibold text-risk">{signal.count} hit{signal.count === 1 ? "" : "s"}</span>}
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{signal.value}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{signal.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              <Database className="mt-0.5 h-4 w-4 shrink-0" />
              No matching scam fingerprint has appeared in your saved intelligence yet. Future scans and reports will make this stronger.
            </div>
          )}
        </>
      )}
    </section>
  );
}
