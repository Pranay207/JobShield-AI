import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="font-extrabold tracking-tight font-heading">JobShield AI</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Verify before you trust. Protect before you pay.
            </p>
          </div>
          <div className="text-xs text-muted-foreground sm:text-right">
            <p>AI-assisted job-offer scam detection for India.</p>
            <p className="mt-1">Company verification uses public web signals and available verification clues.</p>
            <p className="mt-2 text-muted-foreground/70">Not legal advice. Always exercise independent judgement.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
