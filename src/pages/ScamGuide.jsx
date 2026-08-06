import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ScanLine, CheckCircle2, Circle, ShieldAlert, ShieldCheck, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";

const FLAGS = [
  { id: "payment", title: "Upfront payment demand", severity: 18, what: "Asks for a registration, training, security deposit, equipment, or 'refundable' fee before you can start.", example: "“Pay ₹1,500 as a one-time registration fee to activate your offer.”" },
  { id: "urgency", title: "High-pressure / urgency", severity: 10, what: "Pushes you to act immediately — 'today only', 'last chance', 'reply within 2 hours'.", example: "“This offer is valid for today only. Reply immediately to confirm.”" },
  { id: "generic_email", title: "Generic email domain as official contact", severity: 12, what: "A supposedly real company contacts you from gmail.com, yahoo.com, rediffmail.com, etc. instead of its own domain.", example: "“hr.tcs.recruitment@gmail.com”" },
  { id: "messaging_app", title: "Contact only via WhatsApp / Telegram / mobile", severity: 12, what: "All communication happens on personal messaging apps or a personal mobile number — never a corporate email or landline.", example: "“WhatsApp me on 98xxxxxxxx to proceed with the interview.”" },
  { id: "unrealistic_salary", title: "Unrealistic salary for easy work", severity: 10, what: "'Work from home, earn ₹30,000/week for 1 hour a day' — pay that's wildly out of line with the role or effort.", example: "“Earn ₹50,000 weekly by liking YouTube videos from home.”" },
  { id: "no_interview", title: "Hired with no real interview", severity: 14, what: "You're offered the job without any interview, screening, or technical round — often 'selected from a job portal'.", example: "“You have been selected from Naukri as a candidate. No interview required.”" },
  { id: "documents_upfront", title: "Sensitive documents requested immediately", severity: 8, what: "Asks for Aadhaar, PAN, bank details, or photos before any interview or offer letter.", example: "“Share your Aadhaar card and bank account details to process your salary.”" },
  { id: "vague_company", title: "Vague or unverifiable company", severity: 10, what: "No clear company name, no address, no website, or a name that mimics a famous brand with a slight spelling change.", example: "“Infosyss Technologies Pvt Ltd” (note the extra 's') with no website." },
];

export default function ScamGuide() {
  const [checked, setChecked] = useState({});

  const score = useMemo(
    () => Math.min(100, Object.keys(checked).filter((id) => checked[id]).reduce((a, id) => a + (FLAGS.find((f) => f.id === id)?.severity || 0), 0)),
    [checked]
  );

  const meta =
    score >= 70 ? { level: "High Risk", color: "text-risk", bg: "bg-risk/10", icon: ShieldAlert, msg: "Strong scam signals. Do not pay, share documents, or click links. Report it." }
    : score >= 40 ? { level: "Medium Risk", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle, msg: "Several warning signs. Pause, verify the company independently, and don't share anything sensitive yet." }
    : score > 0 ? { level: "Low Risk", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: ShieldCheck, msg: "Few signs so far — still verify the company and offer letter before proceeding." }
    : { level: "Not scored", color: "text-muted-foreground", bg: "bg-muted", icon: Lightbulb, msg: "Tick any warning signs you've noticed in the offer to get a quick estimate." };

  const Icon = meta.icon;
  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-3xl font-extrabold tracking-tight font-heading">Scam red flags guide</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Can't or don't want to upload the offer yet? Use this self-check. Tick every warning sign you've spotted in the offer — you'll get a quick risk estimate and plain-language advice.
          </p>

          {/* Live estimate */}
          <div className={`mt-6 rounded-2xl border border-border ${meta.bg} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-6 w-6 ${meta.color}`} />
                <span className={`text-lg font-bold font-heading ${meta.color}`}>{meta.level}</span>
              </div>
              <span className={`text-3xl font-extrabold font-heading ${meta.color}`}>{score}<span className="text-base text-muted-foreground">/100</span></span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{meta.msg}</p>
          </div>

          {/* Checklist */}
          <div className="mt-8 space-y-3">
            {FLAGS.map((f) => {
              const on = !!checked[f.id];
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`w-full rounded-2xl border bg-card p-4 text-left transition-colors ${on ? "border-primary/50 ring-1 ring-primary/30" : "border-border hover:border-primary/30"}`}
                >
                  <div className="flex items-start gap-3">
                    {on ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{f.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">+{f.severity} pts</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{f.what}</p>
                      <p className="mt-2 rounded-lg bg-muted/70 px-3 py-2 text-xs italic text-muted-foreground">{f.example}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/analyzer"><ScanLine className="mr-2 h-4 w-4" />Check the full offer with AI</Link>
            </Button>
            <Button variant="outline" onClick={() => setChecked({})}>
              Reset checklist
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            This self-check is an educational aid, not a verdict. For a full analysis, paste the offer text or upload a screenshot in the analyzer.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}