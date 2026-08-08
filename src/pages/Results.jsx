import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, Share2, ScanLine, Lightbulb, Loader2, AlertCircle, FileText, Copy, Check } from "lucide-react";
import { api } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import RiskScoreCard from "@/components/jobshield/RiskScoreCard";
import RedFlagsList from "@/components/jobshield/RedFlagsList";
import CompanyVerificationCard from "@/components/jobshield/CompanyVerificationCard";
import VerdictShare from "@/components/jobshield/VerdictShare";
import ScamCoach from "@/components/jobshield/ScamCoach";
import ScamFingerprintCard from "@/components/jobshield/ScamFingerprintCard";
import PaymentGuardCard from "@/components/jobshield/PaymentGuardCard";
import ActionPlanCard from "@/components/jobshield/ActionPlanCard";
import CompanyTrustGraph from "@/components/jobshield/CompanyTrustGraph";
import CommunityAlertCard from "@/components/jobshield/CommunityAlertCard";
import OfferDnaCard from "@/components/jobshield/OfferDnaCard";
import RecruiterRealityCard from "@/components/jobshield/RecruiterRealityCard";
import TrustPathTimeline from "@/components/jobshield/TrustPathTimeline";
import RecruiterProofCard from "@/components/jobshield/RecruiterProofCard";

export default function Results() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showText, setShowText] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await api.entities.Scan.get(id);
        if (!active) return;
        setScan(s);
      } catch (e) {
        setError("We couldn't load this report. It may have been removed or the link is invalid.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const downloadEvidenceReport = async () => {
    const { generateEvidenceReport } = await import("@/lib/jobshieldReport");
    generateEvidenceReport(scan);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          {loading ? (
            <div className="mt-20 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-3 text-sm">Loading report...</p>
            </div>
          ) : error ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">{error}</p>
              <Button asChild className="mt-6">
                <Link to="/analyzer"><ScanLine className="mr-2 h-4 w-4" />Check another offer</Link>
              </Button>
            </div>
          ) : scan ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight font-heading">Analysis report</h1>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scan.created_date).toLocaleString()}
                    {scan.language_detected ? ` · ${scan.language_detected}` : ""}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    {copied ? <Check className="mr-1.5 h-4 w-4 text-emerald-500" /> : <Share2 className="mr-1.5 h-4 w-4" />}
                    {copied ? "Copied" : "Share"}
                  </Button>
                  <Button size="sm" onClick={downloadEvidenceReport}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Evidence report
                  </Button>
                </div>
              </div>

              <div className="mt-5">
                <RiskScoreCard score={scan.risk_score} level={scan.risk_level} summary={scan.summary} />
              </div>

              <PaymentGuardCard scan={scan} />

              <TrustPathTimeline scan={scan} />

              <ScamFingerprintCard scan={scan} />

              <CommunityAlertCard scan={scan} />

              <ActionPlanCard scan={scan} />

              <section className="mt-8">
                <h2 className="mb-3 text-lg font-bold font-heading">Red flags</h2>
                <RedFlagsList redFlags={scan.red_flags} />
              </section>

              <OfferDnaCard scan={scan} />

              <RecruiterRealityCard scan={scan} />

              <RecruiterProofCard scan={scan} />

              <CompanyTrustGraph scan={scan} />

              <section className="mt-8">
                <CompanyVerificationCard companyName={scan.company_name} verification={scan.company_verification} />
              </section>

              <VerdictShare scan={scan} />

              <ScamCoach scan={scan} />

              {scan.recommendations && scan.recommendations.length > 0 && (
                <section className="mt-8 rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold font-heading">Recommendations</h2>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {scan.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mt-8">
                <button
                  onClick={() => setShowText((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
                >
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" />Original offer text</span>
                  <span className="text-xs text-muted-foreground">{showText ? "Hide" : "Show"}</span>
                </button>
                {showText && (
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-4 text-xs text-muted-foreground">
                    {scan.raw_text}
                  </pre>
                )}
              </section>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild>
                  <Link to="/analyzer"><ScanLine className="mr-2 h-4 w-4" />Check another offer</Link>
                </Button>
                <Button variant="outline" onClick={copyLink}>
                  {copied ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Copy className="mr-2 h-4 w-4" />}
                  Copy shareable link
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}




