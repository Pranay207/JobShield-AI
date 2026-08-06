import React from "react";
import { Ban, IndianRupee, ShieldAlert } from "lucide-react";
import { buildPaymentGuard } from "@/lib/safetyFeatures";

export default function PaymentGuardCard({ scan }) {
  const guard = buildPaymentGuard(scan);
  if (!guard) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-risk/30 bg-risk/10">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-risk text-white">
          <Ban className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-risk font-heading">{guard.title}</h2>
            {guard.amount && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-risk">
                <IndianRupee className="h-3.5 w-3.5" />
                {guard.amount}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-risk/90">{guard.message}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {guard.checks.map((check) => (
              <div key={check} className="flex items-start gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-risk" />
                <span>{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
