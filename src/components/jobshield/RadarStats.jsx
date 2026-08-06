import React from "react";
import { ShieldCheck, Users, IndianRupee, AlertTriangle } from "lucide-react";

export default function RadarStats({ scansCount, reportsCount, moneyProtected, blockedCount }) {
  const items = [
    { icon: ScanIcon, label: "Offers analysed", value: scansCount.toLocaleString("en-IN"), tone: "text-primary", bg: "bg-primary/10" },
    { icon: IndianRupee, label: "Money protected (est.)", value: `₹${(moneyProtected / 100000).toFixed(1)}L`, tone: "text-emerald-600", bg: "bg-emerald-500/10" },
    { icon: AlertTriangle, label: "Scams flagged", value: blockedCount.toLocaleString("en-IN"), tone: "text-risk", bg: "bg-risk/10" },
    { icon: Users, label: "Community reports", value: reportsCount.toLocaleString("en-IN"), tone: "text-amber-600", bg: "bg-amber-500/10" }
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="min-w-0 rounded-2xl border border-border bg-card p-4">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${it.bg} ${it.tone}`}>
            <it.icon className="h-5 w-5" />
          </span>
          <p className="mt-3 break-words text-xl font-extrabold tracking-tight font-heading sm:text-2xl">{it.value}</p>
          <p className="text-xs text-muted-foreground">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

function ScanIcon(props) {
  return <ShieldCheck {...props} />;
}
