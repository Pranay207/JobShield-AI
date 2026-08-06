import React from "react";
import { ClipboardPaste, FileSearch, BrainCircuit, Building2, FileDown } from "lucide-react";

const steps = [
  { icon: ClipboardPaste, title: "1. Paste or upload", text: "Drop in the job-offer text, a WhatsApp/Telegram screenshot, or a PDF letter." },
  { icon: FileSearch, title: "2. Text extracted", text: "We read text from images and PDFs (English, Hindi & Telugu supported)." },
  { icon: BrainCircuit, title: "3. AI red-flag scan", text: "An AI checks for upfront fees, urgency, fake domains, unrealistic pay and more." },
  { icon: Building2, title: "4. Company verified", text: "We cross-check the company using public web signals and verification clues." },
  { icon: FileDown, title: "5. Risk score & report", text: "Get a 0-100 risk score, a verdict, and a downloadable evidence PDF for cybercrime.gov.in." }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight font-heading">How JobShield works</h2>
        <p className="mt-2 text-muted-foreground">Fast checks for suspicious job offers, screenshots, and letters.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <step.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-sm font-bold font-heading">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
