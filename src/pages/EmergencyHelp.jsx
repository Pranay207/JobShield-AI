import React from "react";
import { AlertTriangle, Ban, Building2, ClipboardCheck, ExternalLink, FileDown, PhoneCall, ShieldAlert } from "lucide-react";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Ban, title: "Stop payment now", text: "Do not send any more money, documents, OTPs, remote-access codes, or bank details." },
  { icon: PhoneCall, title: "If money was sent, call 1930", text: "Call India's cyber fraud helpline quickly. Faster reporting can improve chances of freezing funds." },
  { icon: Building2, title: "Contact bank/payment app", text: "Raise a fraud dispute with your bank, UPI app, wallet, or card provider and request transaction freeze." },
  { icon: ClipboardCheck, title: "Preserve evidence", text: "Save screenshots, phone numbers, UPI IDs, emails, job posts, receipts, chat exports, and this JobShield report." },
  { icon: ShieldAlert, title: "Report online", text: "File a complaint on the national cybercrime portal with all evidence and transaction details." }
];

export default function EmergencyHelp() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <section className="rounded-2xl border border-risk/30 bg-risk/10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-risk text-white">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-risk font-heading">Emergency Help</h1>
                <p className="mt-2 text-sm text-risk/90">
                  Use this if you paid money, shared documents, sent OTPs, or feel pressured by a recruiter.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="bg-risk text-white hover:bg-risk/90">
                    <a href="tel:1930"><PhoneCall className="mr-2 h-4 w-4" />Call 1930</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      cybercrime.gov.in
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Step {index + 1}</p>
                  <h2 className="mt-1 font-bold font-heading">{step.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-heading">Evidence checklist</h2>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {["Recruiter name and phone", "UPI ID or bank account", "Payment receipt", "Offer letter", "Chat screenshots", "Job post link", "Email headers/sender address", "JobShield evidence report"].map((item) => (
                <label key={item} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-primary" />
                  {item}
                </label>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
