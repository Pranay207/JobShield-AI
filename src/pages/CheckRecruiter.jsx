import React, { useState } from "react";
import { Mail, ScanLine, UserSearch } from "lucide-react";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RecruiterRealityCard from "@/components/jobshield/RecruiterRealityCard";

export default function CheckRecruiter() {
  const [text, setText] = useState("");
  const [scan, setScan] = useState(null);

  const run = () => {
    if (text.trim().length < 20) return;
    setScan({
      raw_text: text.trim(),
      company_name: "",
      company_verification: null,
      recruiter_identity: null
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserSearch className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-heading">Check Recruiter</h1>
              <p className="text-sm text-muted-foreground">Paste recruiter message, email signature, LinkedIn URL, phone, or offer text.</p>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste recruiter details here: name, email, phone, LinkedIn URL, company name, WhatsApp/Telegram message..."
              className="min-h-[220px] resize-y"
            />
            <Button onClick={run} className="mt-4 w-full" size="lg" disabled={text.trim().length < 20}>
              <ScanLine className="mr-2 h-5 w-5" />
              Run identity check
            </Button>
          </section>

          {!scan && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>Best demo: paste a fake HR message using a Gmail address, WhatsApp number, and a real company name. JobShield will show impersonation risk.</span>
            </div>
          )}

          {scan && <RecruiterRealityCard scan={scan} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
