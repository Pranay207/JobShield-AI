import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, ShieldAlert, Activity, Clock, AlertTriangle } from "lucide-react";
import { api } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import ScanHistoryList from "@/components/jobshield/ScanHistoryList";
import SafetyPulseCard from "@/components/jobshield/SafetyPulseCard";
import RedFlagTrendsChart from "@/components/jobshield/RedFlagTrendsChart";

function levelBadge(level) {
  if (level?.startsWith("High")) return "bg-risk/15 text-risk";
  if (level?.startsWith("Medium")) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  if (level?.startsWith("Low")) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  return "bg-muted text-muted-foreground";
}

export default function Dashboard() {
  const [scans, setScans] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.entities.Scan.listMine("-created_date", 100);
        setScans(list);
        const p = await api.entities.ScamPattern.list("-weight", 12);
        setPatterns(p);
      } catch (e) {
        setScans([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = scans?.length || 0;
  const highRisk = scans?.filter((s) => s.risk_level === "High Risk").length || 0;
  const avg = total ? Math.round(scans.reduce((a, s) => a + (s.risk_score || 0), 0) / total) : 0;

  // Top recurring red flags are now rendered by the RedFlagTrendsChart component.
  const stats = [
    { icon: ScanLine, label: "Total scans", value: total },
    { icon: ShieldAlert, label: "High-risk detected", value: highRisk },
    { icon: Activity, label: "Avg risk score", value: avg },
    { icon: Clock, label: "Last scan", value: scans?.[0] ? new Date(scans[0].created_date).toLocaleDateString() : "—" }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-heading">Dashboard</h1>
              <p className="text-muted-foreground">Your scan history and community scam trends.</p>
            </div>
            <Button asChild>
              <Link to="/analyzer"><ScanLine className="mr-2 h-4 w-4" />Check an offer</Link>
            </Button>
          </div>

          {scans && <SafetyPulseCard scans={scans} />}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-2xl font-extrabold font-heading">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {scans && <RedFlagTrendsChart scans={scans} />}

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            {/* Recent scans */}
            <div className="lg:col-span-3">
              <h2 className="mb-3 text-lg font-bold font-heading">Scan history</h2>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <ScanHistoryList scans={scans} />
              )}
            </div>

            <div className="lg:col-span-2">
              {patterns.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 text-risk" />
                    Known scam patterns we track
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {patterns.map((p) => (
                      <span key={p.id} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground" title={`Weight ${p.weight}`}>
                        {p.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
