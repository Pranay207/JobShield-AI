import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ScanLine, ArrowRight, Lock, Globe, FileDown, BookOpen, Radar as RadarIcon, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import HowItWorks from "@/components/jobshield/HowItWorks";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                India-focused job-offer scam detector
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight font-heading sm:text-6xl">
                JobShield AI
              </h1>
              <p className="mt-4 text-xl font-medium text-muted-foreground sm:text-2xl">
                Verify before you trust. Protect before you pay.
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Paste a job-offer message or upload a screenshot/PDF. JobShield AI reads it, scans for scam
                red flags with AI, checks the company, and gives you a clear risk score — plus a downloadable
                evidence report for cybercrime.gov.in.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-8 text-base">
                  <Link to="/analyzer">
                    <ScanLine className="mr-2 h-5 w-5" />
                    Check an Offer
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                  <Link to="/guide">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Red flags self-check
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-3">
              {[
                { icon: Globe, title: "Multilingual", text: "Understands English, Hindi & Telugu offers." },
                { icon: Lock, title: "Privacy-first", text: "Your scans are saved to your own account." },
                { icon: FileDown, title: "Evidence ready", text: "One-tap PDF for cybercrime reporting." }
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-border bg-card p-5 text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-semibold font-heading">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase: Community Scam Radar + AI Coach */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <RadarIcon className="h-4 w-4 text-primary" />
                New · Community-powered
              </span>
              <h2 className="mt-6 text-3xl font-extrabold tracking-tight font-heading sm:text-4xl">
                One shield gets stronger for everyone
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Every scan and every report feeds a live community radar — trending scam types, most-reported fake
                companies, and money protected together. Plus an AI coach that answers your questions after every check.
              </p>
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
              <Link
                to="/radar"
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <RadarIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-xl font-bold font-heading">Community Scam Radar</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  See live scam trends, report fakes you've seen, and help protect other job seekers across India.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open the radar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <div className="rounded-2xl border border-border bg-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                  <MessageSquare className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-xl font-bold font-heading">AI Scam Coach</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  After any scan, chat with an AI coach — ask why it's risky, how to reply to the recruiter, or how to
                  report it to cybercrime.gov.in.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/guide">Learn what to ask <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* Safety CTA */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-extrabold tracking-tight font-heading sm:text-3xl">
              Paid money or shared documents?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Use the emergency checklist to preserve evidence, contact 1930, and report safely.
            </p>
            <Button asChild size="lg" variant="outline" className="mt-8 h-12 px-8 text-base">
              <Link to="/emergency-help">
                Emergency Help
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}