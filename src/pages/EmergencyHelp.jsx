import React, { useMemo, useState } from "react";
import { AlertTriangle, Ban, Building2, ClipboardCheck, Copy, ExternalLink, FileDown, LockKeyhole, PhoneCall, ShieldAlert, Smartphone, WalletCards } from "lucide-react";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const incidents = [
  {
    key: "paid",
    label: "I paid money",
    icon: WalletCards,
    risk: "Highest urgency",
    steps: [
      "Call 1930 immediately and report the transaction before funds move further.",
      "Open your bank, UPI app, wallet, or card support and raise a fraud dispute.",
      "Save UPI ID, bank account, transaction ID, receipt, amount, date, and chat screenshots.",
      "Do not pay a recovery fee or refund release fee. That is a common second scam.",
      "File a complaint on cybercrime.gov.in with payment proof and recruiter details."
    ],
    evidence: ["Transaction ID", "UPI ID or bank account", "Amount and timestamp", "Payment receipt", "Recruiter phone/email", "Chat screenshots"]
  },
  {
    key: "docs",
    label: "I shared documents",
    icon: ClipboardCheck,
    risk: "Identity safety",
    steps: [
      "Stop sending more documents, selfies, OTPs, signatures, or bank details.",
      "Write down exactly which documents were shared and where they were sent.",
      "Watch bank accounts, SIM activity, and email login alerts for suspicious activity.",
      "If Aadhaar/PAN/bank details were misused, report on cybercrime.gov.in and inform your bank.",
      "Preserve the original chat and file-transfer proof before blocking the sender."
    ],
    evidence: ["Shared document list", "Chat screenshots", "Sender number/email", "Upload links", "Job post link", "Offer letter"]
  },
  {
    key: "otp",
    label: "I shared OTP/password",
    icon: LockKeyhole,
    risk: "Account takeover",
    steps: [
      "Change passwords for email, banking, job portals, and social accounts immediately.",
      "Log out of all sessions and enable two-factor authentication where possible.",
      "Call your bank if banking OTP, card OTP, UPI PIN, or netbanking details were shared.",
      "Check email forwarding rules and recovery phone/email settings for tampering.",
      "Report the incident with screenshots and timestamps."
    ],
    evidence: ["OTP request screenshot", "Login alert emails", "Account names", "Time of sharing", "Phone/email used", "Suspicious links"]
  },
  {
    key: "app",
    label: "I installed an app",
    icon: Smartphone,
    risk: "Device safety",
    steps: [
      "Disconnect from the scammer and uninstall any remote-access or unknown app.",
      "Revoke accessibility, notification, SMS, screen-recording, and file permissions.",
      "Run a device security scan and update your OS/browser.",
      "Change passwords from a different trusted device if banking or email was open.",
      "Call your bank if the app had screen, SMS, or payment access."
    ],
    evidence: ["App name", "Install link", "Permissions granted", "Screenshots", "Caller number", "Payment activity"]
  }
];

const commonSteps = [
  { icon: Ban, title: "Stop contact", text: "Do not send more money, documents, OTPs, remote-access codes, or bank details." },
  { icon: PhoneCall, title: "Call 1930 if money is involved", text: "Fast reporting improves the chance of freezing funds before they move." },
  { icon: Building2, title: "Contact bank or payment app", text: "Raise a fraud dispute and request a freeze or reversal review." },
  { icon: ShieldAlert, title: "Report online", text: "File a complaint on cybercrime.gov.in with screenshots, transaction proof, and recruiter details." }
];

export default function EmergencyHelp() {
  const [selected, setSelected] = useState("paid");
  const incident = incidents.find((item) => item.key === selected) || incidents[0];
  const Icon = incident.icon;

  const summary = useMemo(() => {
    return `JobShield emergency summary\nIncident: ${incident.label}\nPriority: ${incident.risk}\nImmediate action: ${incident.steps[0]}\nReport: Call 1930 if money was lost and file at cybercrime.gov.in.`;
  }, [incident]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // Clipboard can be unavailable in some mobile browsers.
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <section className="rounded-2xl border border-risk/30 bg-risk/10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-risk text-white">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-risk font-heading">Emergency Loss Mode</h1>
                <p className="mt-2 text-sm text-risk/90">
                  Use this if you paid money, shared documents, sent OTPs, installed an app, or feel trapped by a recruiter.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="bg-risk text-white hover:bg-risk/90">
                    <a href="tel:1930"><PhoneCall className="mr-2 h-4 w-4" />Call 1930</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />cybercrime.gov.in
                    </a>
                  </Button>
                  <Button variant="outline" onClick={copySummary}>
                    <Copy className="mr-2 h-4 w-4" />Copy incident summary
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold font-heading">What happened?</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {incidents.map((item) => {
                const ItemIcon = item.icon;
                const active = item.key === selected;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelected(item.key)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition hover:border-primary/50",
                      active ? "border-primary bg-primary/10" : "border-border bg-card"
                    )}
                  >
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <ItemIcon className="h-5 w-5" />
                    </span>
                    <span className="mt-3 block text-sm font-bold">{item.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{item.risk}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-risk/10 text-risk">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold font-heading">Priority plan: {incident.label}</h2>
                  <p className="text-sm text-muted-foreground">Follow these steps in order. Do not negotiate with the scammer.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {incident.steps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold font-heading">Evidence to collect</h2>
              </div>
              <div className="mt-4 grid gap-2">
                {incident.evidence.map((item) => (
                  <label key={item} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-primary" />
                    {item}
                  </label>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold font-heading">Always do this first</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {commonSteps.map((step) => (
                <div key={step.title} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}