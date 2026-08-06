import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";

const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const SEVERITY_COLOR = {
  high: "hsl(var(--risk))",
  medium: "#f59e0b",
  low: "#10b981"
};

function dominantSeverity(row) {
  if (row.high >= row.medium && row.high >= row.low) return "high";
  if (row.medium >= row.low) return "medium";
  return "low";
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-md">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="mt-1 text-muted-foreground">
        Detected in {d.count} scan{d.count === 1 ? "" : "s"} · weighted {d.score}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-3">
        {d.high > 0 && <span className="text-risk">High {d.high}</span>}
        {d.medium > 0 && <span className="text-amber-600 dark:text-amber-400">Medium {d.medium}</span>}
        {d.low > 0 && <span className="text-emerald-600 dark:text-emerald-400">Low {d.low}</span>}
      </div>
    </div>
  );
}

export default function RedFlagTrendsChart({ scans }) {
  const data = useMemo(() => {
    const map = {};
    (scans || []).forEach((s) => {
      (s.red_flags || []).forEach((f) => {
        const key = f.title || f.type || "Other";
        if (!map[key]) map[key] = { name: key, count: 0, score: 0, high: 0, medium: 0, low: 0 };
        map[key].count += 1;
        const sev = String(f.severity || "medium").toLowerCase();
        map[key][sev] = (map[key][sev] || 0) + 1;
        map[key].score += SEVERITY_WEIGHT[sev] || 2;
      });
    });
    return Object.values(map).sort((a, b) => b.score - a.score).slice(0, 10);
  }, [scans]);

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-risk" />
        <h2 className="text-lg font-bold font-heading">Top recurring red flags</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        The scam tactics showing up most often across your scans — ranked by how often and how severely they appear.
      </p>

      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No red flags detected yet. Scan a few job offers to see which tactics recur.
        </p>
      ) : (
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {data.map((row, i) => (
                  <Cell key={i} fill={SEVERITY_COLOR[dominantSeverity(row)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-risk" />High severity</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Medium</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Low</span>
          </div>
        </div>
      )}
    </div>
  );
}