import React from "react";
import { BadgeCheck, Chrome, Clipboard, ExternalLink, MousePointerClick, RadioTower } from "lucide-react";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";

const path = "C:\\Users\\Shiva\\Downloads\\Jobshield\\extension\\jobshield-copilot";

export default function BrowserCopilot() {
  const copyPath = () => navigator.clipboard?.writeText(path);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RadioTower className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-heading">Browser Copilot</h1>
              <p className="text-sm text-muted-foreground">Real-time scam warnings on Gmail, LinkedIn, WhatsApp Web, Telegram Web, and job portals.</p>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold font-heading">Install extension</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                "Open chrome://extensions or edge://extensions",
                "Turn on Developer mode",
                "Click Load unpacked",
                `Select ${path}`,
                "Open a job message page and watch for the JobShield widget"
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
            <button onClick={copyPath} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent">
              <Clipboard className="h-4 w-4" />
              Copy extension folder path
            </button>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: MousePointerClick, title: "Inline Warnings", text: "Risky phrases are highlighted directly on the page." },
              { icon: BadgeCheck, title: "Risk Widget", text: "Floating score shows Clear, Watch, Medium, or High Risk." },
              { icon: ExternalLink, title: "Open Scanner", text: "Send page text into JobShield Analyzer with one click." }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-bold font-heading">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
