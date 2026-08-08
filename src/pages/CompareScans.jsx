import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, FileText, Loader2, ScanLine, ShieldCheck, TriangleAlert } from "lucide-react";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import { Button } from "@/components/ui/button";
import { api } from "@/api/supabaseClient";
import { cn } from "@/lib/utils";

function riskTone(level) {
  if (level?.startsWith("High")) return "border-risk/35 bg-risk/10 text-risk";
  if (level?.startsWith("Medium")) return "border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  if (level?.startsWith("Low")) return "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  return "border-border bg-muted text-muted-foreground";
}

function formatScanLabel(scan) {
  const name = scan.company_name || "Unknown company";
  const date = scan.created_date ? new Date(scan.created_date).toLocaleDateString() : "No date";
  return `${name} - ${Math.round(scan.risk_score || 0)}/100 - ${date}`;
}

function saferChoice(left, right) {
  if (!left || !right) return null;
  const leftScore = Number(left.risk_score || 0);
  const rightScore = Number(right.risk_score || 0);
  if (Math.abs(leftScore - rightScore) < 5) {
    return {
      title: "Very close risk profile",
      text: "Both offers need similar caution. Compare the red flags and verify the recruiter before sharing documents or payment details.",
      tone: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200"
    };
  }
  const safer = leftScore < rightScore ? left : right;
  const riskier = leftScore < rightScore ? right : left;
  return {
    title: `${safer.company_name || "One offer"} looks safer`,
    text: `${riskier.company_name || "The other offer"} has a higher risk score by ${Math.abs(leftScore - rightScore)} points.`,
    tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
  };
}

function ScanPicker({ label, value, scans, excludeId, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
      >
        <option value="">Select a scan result</option>
        {scans.map((scan) => (
          <option key={scan.id} value={scan.id} disabled={scan.id === excludeId}>
            {formatScanLabel(scan)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonCard({ scan, side }) {
  if (!scan) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Select {side} scan to compare.
      </div>
    );
  }

  const flags = scan.red_flags || [];
  const highFlags = flags.filter((flag) => flag.severity === "high").length;

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold font-heading">{scan.company_name || "Unknown company"}</p>
          <p className="text-xs text-muted-foreground">{scan.created_date ? new Date(scan.created_date).toLocaleString() : "No scan date"}</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", riskTone(scan.risk_level))}>
          {scan.risk_level || "Unknown"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted p-3">
          <p className="text-xs text-muted-foreground">Risk score</p>
          <p className="mt-1 text-2xl font-extrabold font-heading">{Math.round(scan.risk_score || 0)}</p>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <p className="text-xs text-muted-foreground">Red flags</p>
          <p className="mt-1 text-2xl font-extrabold font-heading">{flags.length}</p>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <p className="text-xs text-muted-foreground">High flags</p>
          <p className="mt-1 text-2xl font-extrabold font-heading">{highFlags}</p>
        </div>
      </div>

      <section className="mt-5">
        <h3 className="text-sm font-bold font-heading">AI summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{scan.summary || "No AI summary available."}</p>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-bold font-heading">Top red flags</h3>
        {flags.length ? (
          <div className="mt-2 space-y-2">
            {flags.slice(0, 5).map((flag, index) => (
              <div key={`${flag.title || flag.type}-${index}`} className="rounded-xl border border-border p-3">
                <div className="flex items-start gap-2">
                  <TriangleAlert className={cn("mt-0.5 h-4 w-4 shrink-0", flag.severity === "high" ? "text-risk" : "text-amber-500")} />
                  <div>
                    <p className="text-sm font-semibold">{flag.title || flag.type || "Red flag"}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{flag.description || flag.evidence || "No detail available."}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">No specific red flags detected.</p>
        )}
      </section>

      {scan.recommendations?.length > 0 && (
        <section className="mt-5">
          <h3 className="text-sm font-bold font-heading">Recommended action</h3>
          <ul className="mt-2 space-y-2">
            {scan.recommendations.slice(0, 4).map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button asChild variant="outline" className="mt-5 w-full">
        <Link to={`/results/${scan.id}`}>
          Open full report
          <FileText className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}

export default function CompareScans() {
  const [scans, setScans] = useState(null);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  useEffect(() => {
    let active = true;
    api.entities.Scan.listMine("-created_date", 200)
      .then((data) => {
        if (!active) return;
        const list = data || [];
        setScans(list);
        setLeftId(list[0]?.id || "");
        setRightId(list.find((scan) => scan.id !== list[0]?.id)?.id || "");
      })
      .catch(() => {
        if (active) setScans([]);
      });
    return () => { active = false; };
  }, []);

  const left = useMemo(() => scans?.find((scan) => scan.id === leftId), [scans, leftId]);
  const right = useMemo(() => scans?.find((scan) => scan.id === rightId), [scans, rightId]);
  const verdict = saferChoice(left, right);

  const swapScans = () => {
    setLeftId(rightId);
    setRightId(leftId);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ArrowRightLeft className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight font-heading">Compare Scans</h1>
                <p className="text-sm text-muted-foreground">Place two job offers side by side before deciding what to trust.</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/analyzer"><ScanLine className="mr-2 h-4 w-4" />New scan</Link>
            </Button>
          </div>

          {!scans ? (
            <div className="mt-16 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading saved scans...
            </div>
          ) : scans.length < 2 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <FileText className="mx-auto h-9 w-9 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-bold font-heading">Two scans are needed</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Run one more offer scan and this page will compare both results side by side.
              </p>
              <Button asChild className="mt-5">
                <Link to="/analyzer">Check another offer</Link>
              </Button>
            </div>
          ) : (
            <>
              <section className="mt-8 rounded-2xl border border-border bg-card p-5">
                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
                  <ScanPicker label="First scan" value={leftId} scans={scans} excludeId={rightId} onChange={setLeftId} />
                  <Button type="button" variant="outline" onClick={swapScans} className="md:mb-0.5">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Swap
                  </Button>
                  <ScanPicker label="Second scan" value={rightId} scans={scans} excludeId={leftId} onChange={setRightId} />
                </div>
              </section>

              {verdict && (
                <section className={cn("mt-5 rounded-2xl border p-4", verdict.tone)}>
                  <p className="font-bold font-heading">{verdict.title}</p>
                  <p className="mt-1 text-sm opacity-90">{verdict.text}</p>
                </section>
              )}

              <section className="mt-6 grid gap-5 lg:grid-cols-2">
                <ComparisonCard scan={left} side="first" />
                <ComparisonCard scan={right} side="second" />
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
