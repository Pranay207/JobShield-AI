import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Radar as RadarIcon, Shield, Loader2, AlertCircle, Info, Search, X } from "lucide-react";
import { api } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import RadarStats from "@/components/jobshield/RadarStats";
import TrendingPatterns from "@/components/jobshield/TrendingPatterns";
import FakeCompanyBlacklist from "@/components/jobshield/FakeCompanyBlacklist";
import RecentReports from "@/components/jobshield/RecentReports";
import CommunityReportForm from "@/components/jobshield/CommunityReportForm";
import CommunityAlertsPanel from "@/components/jobshield/CommunityAlertsPanel";
import { Link } from "react-router-dom";

export default function Radar() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scans, setScans] = useState([]);
  const [reports, setReports] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allScans, allReports] = await Promise.all([
        api.entities.Scan.list("-created_date", 200),
        api.entities.CommunityReport.list("-created_date", 200)
      ]);
      setScans(allScans || []);
      setReports(allReports || []);
    } catch (e) {
      setError("We couldn't load the community radar right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, reloadKey]);

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => (r.company_name || "").toLowerCase().includes(q));
  }, [reports, query]);

  const scansCount = scans.length;
  const blockedCount = scans.filter((s) => s.risk_level === "High Risk").length;
  const reportsCount = reports.length;
  // Money protected estimate: sum of (avg scam fee ~₹1500) over high-risk scans + reported amounts
  const reportedMoney = reports.reduce((sum, r) => sum + (r.amount_demanded || 0), 0);
  const moneyProtected = reportedMoney + blockedCount * 1500;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RadarIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-heading sm:text-4xl">Community Scam Radar</h1>
              <p className="text-sm text-muted-foreground">Live intelligence from every offer JobShield users scan and report.</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-16 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-3 text-sm">Scanning the radar…</p>
            </div>
          ) : error ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">{error}</p>
              <Button onClick={() => setReloadKey((k) => k + 1)} className="mt-6">Try again</Button>
            </div>
          ) : (
            <>
              <div className="mt-8">
                <RadarStats
                  scansCount={scansCount}
                  reportsCount={reportsCount}
                  moneyProtected={moneyProtected}
                  blockedCount={blockedCount}
                />
              </div>

              <div className="mt-6">
                <CommunityReportForm onSubmitted={() => setReloadKey((k) => k + 1)} />
              </div>

              <div className="mt-8">
                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search reported scams by company name…"
                    className="pl-9 pr-9"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {query.trim() && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} matching "{query.trim()}"
                  </p>
                )}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <CommunityAlertsPanel scans={scans} reports={filteredReports} />
                  <TrendingPatterns reports={filteredReports} />
                  <FakeCompanyBlacklist reports={filteredReports} />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-bold font-heading">Latest community reports</h3>
                  <RecentReports reports={filteredReports.slice(0, 8)} />
                </div>
              </div>

              <div className="mt-10 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Radar stats are built from real scans in your account and community reports. The more people report,
                  the sharper JobShield gets at protecting everyone.
                </p>
              </div>

              <div className="mt-8 text-center">
                <Button asChild size="lg">
                  <Link to="/analyzer"><Shield className="mr-2 h-5 w-5" />Check a new offer</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

