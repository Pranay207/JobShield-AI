import React, { useEffect, useState } from "react";
import { AlertTriangle, FileSearch, IndianRupee, Loader2 } from "lucide-react";
import { analyzeOfferDna, fallbackOfferDna } from "@/lib/offerDna";
import { cn } from "@/lib/utils";

const tone = {
  critical: "bg-risk/15 text-risk",
  high: "bg-risk/15 text-risk",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
};

export default function OfferDnaCard({ scan }) {
  const [dna, setDna] = useState(scan?.offer_dna || null);
  const [loading, setLoading] = useState(!scan?.offer_dna);

  useEffect(() => {
    let active = true;
    const cached = scan?.offer_dna || scan?.contract_risk;
    if (cached) {
      setDna(cached);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    analyzeOfferDna(scan?.raw_text || "")
      .then((result) => { if (active) setDna(result); })
      .catch(() => { if (active) setDna(fallbackOfferDna(scan?.raw_text || "")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scan]);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileSearch className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold font-heading">OfferDNA risk parser</h2>
            <p className="text-sm text-muted-foreground">Clause-level financial and contract trap analysis.</p>
          </div>
        </div>
        {dna && (
          <div className="w-full sm:w-44">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Contract risk</span>
              <span>{Math.round(dna.score || 0)}/100</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, dna.score || 0))}%` }} />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Parsing offer clauses...
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">{dna?.level || "Unknown Contract Risk"}</p>
            {!!dna?.estimated_money_at_risk && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-risk/10 px-3 py-1 text-xs font-semibold text-risk">
                <IndianRupee className="h-3.5 w-3.5" />
                Estimated exposure: ₹{Number(dna.estimated_money_at_risk).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {dna?.clauses?.length ? (
            <div className="mt-4 grid gap-3">
              {dna.clauses.map((clause, index) => (
                <div key={`${clause.type}-${index}`} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-risk" />
                    <h3 className="text-sm font-semibold">{clause.label}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone[clause.severity] || tone.medium)}>
                      {clause.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{clause.explanation}</p>
                  {clause.evidence && (
                    <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">"{clause.evidence}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              No major hidden contract trap was detected in the available text.
            </p>
          )}

          {dna?.recommendation && (
            <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
              {dna.recommendation}
            </p>
          )}
        </>
      )}
    </section>
  );
}
