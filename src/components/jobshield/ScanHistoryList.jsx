import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function levelBadge(level) {
  if (level?.startsWith("High")) return "bg-risk/15 text-risk";
  if (level?.startsWith("Medium")) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  if (level?.startsWith("Low")) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  return "bg-muted text-muted-foreground";
}

const RISK_FILTERS = ["All", "High Risk", "Medium Risk", "Low Risk"];
const DATE_FILTERS = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

export default function ScanHistoryList({ scans }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const [date, setDate] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return (scans || []).filter((s) => {
      if (risk !== "All" && s.risk_level !== risk) return false;
      if (q) {
        const hay = `${s.company_name || ""} ${s.summary || ""} ${s.raw_text || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (date !== "all") {
        const ts = new Date(s.created_date).getTime();
        if (date === "today" && ts < startOfDay) return false;
        if (date === "7d" && ts < now.getTime() - 7 * 864e5) return false;
        if (date === "30d" && ts < now.getTime() - 30 * 864e5) return false;
      }
      return true;
    });
  }, [scans, query, risk, date]);

  return (
    <div>
      <div className="mb-3 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company, summary, or text…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {RISK_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  risk === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {r === "High Risk" ? "High" : r === "Medium Risk" ? "Medium" : r === "Low Risk" ? "Low" : r}
              </button>
            ))}
          </div>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <div className="flex flex-wrap gap-1.5">
            {DATE_FILTERS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDate(d.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  date === d.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {scans?.length ? "No scans match your filters." : "No scans yet. Check your first job offer."}
          </p>
          {scans?.length === 0 && (
            <Button asChild className="mt-4">
              <Link to="/analyzer">Check an offer</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{filtered.length} scan{filtered.length === 1 ? "" : "s"}</p>
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/results/${s.id}`}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {s.company_name || "Unknown company"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.created_date).toLocaleString()} · {(s.red_flags || []).length} red flags
                </p>
              </div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${levelBadge(s.risk_level)}`}>
                {Math.round(s.risk_score || 0)}/100
              </span>
              <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
