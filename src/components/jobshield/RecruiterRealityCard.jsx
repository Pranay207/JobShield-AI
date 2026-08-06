import React, { useEffect, useState } from "react";
import { BadgeCheck, CircleAlert, CircleHelp, Loader2, UserSearch } from "lucide-react";
import { analyzeRecruiterReality, fallbackRecruiterReality } from "@/lib/recruiterReality";
import { cn } from "@/lib/utils";

const styles = {
  pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  fail: "border-risk/30 bg-risk/10 text-risk"
};

const icons = {
  pass: BadgeCheck,
  warn: CircleHelp,
  fail: CircleAlert
};

export default function RecruiterRealityCard({ scan }) {
  const [identity, setIdentity] = useState(scan?.recruiter_identity || null);
  const [loading, setLoading] = useState(!scan?.recruiter_identity);

  useEffect(() => {
    let active = true;
    if (scan?.recruiter_identity) {
      setIdentity(scan.recruiter_identity);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    analyzeRecruiterReality(scan?.raw_text || "", scan)
      .then((result) => { if (active) setIdentity(result); })
      .catch(() => { if (active) setIdentity(fallbackRecruiterReality(scan?.raw_text || "", scan)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scan]);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserSearch className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold font-heading">Recruiter Reality Check</h2>
            <p className="text-sm text-muted-foreground">Detects fake recruiters impersonating real companies.</p>
          </div>
        </div>
        {identity && (
          <span className={cn(
            "w-fit rounded-full px-3 py-1 text-xs font-semibold",
            identity.score >= 75 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : identity.score >= 45 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-risk/15 text-risk"
          )}>
            {identity.status}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Checking recruiter identity...
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-sm font-semibold">{identity?.recruiter_name || "Recruiter name not proven"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Claimed company: {identity?.claimed_company || scan?.company_name || "Not detected"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{identity?.verdict}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Identity score</span>
                <span>{Math.round(identity?.score || 0)}/100</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, identity?.score || 0))}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(identity?.checks || []).map((check) => {
              const Icon = icons[check.status] || CircleHelp;
              return (
                <div key={check.label} className={cn("rounded-xl border p-3", styles[check.status] || styles.warn)}>
                  <Icon className="h-4 w-4" />
                  <p className="mt-2 text-sm font-semibold">{check.label}</p>
                  <p className="mt-1 break-words text-xs opacity-80">{check.detail}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
