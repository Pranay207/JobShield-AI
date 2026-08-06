import React from "react";
import { Loader2, CheckCircle2, XCircle, Clock, UploadCloud, FileSearch, BrainCircuit, Building2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const layers = [
  { key: "upload", label: "Upload", icon: UploadCloud },
  { key: "extract", label: "Extract", icon: FileSearch },
  { key: "analyze", label: "Analyze", icon: BrainCircuit },
  { key: "verify", label: "Verify", icon: Building2 },
  { key: "save", label: "Save", icon: Save }
];

function LayerPill({ layer, activeLayer, status }) {
  const Icon = layer.icon;
  const currentIndex = layers.findIndex((l) => l.key === activeLayer);
  const index = layers.findIndex((l) => l.key === layer.key);
  const done = status === "done" || (status === "processing" && index < currentIndex);
  const active = status === "processing" && layer.key === activeLayer;
  const failed = status === "error" && layer.key === activeLayer;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        active && "border-primary/30 bg-primary/10 text-primary",
        failed && "border-risk/30 bg-risk/10 text-risk",
        !done && !active && !failed && "border-border bg-muted/50 text-muted-foreground"
      )}
    >
      {done ? <CheckCircle2 className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
      {layer.label}
    </span>
  );
}

export default function BatchProgress({ items }) {
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;
  const processing = items.some((i) => i.status === "processing");

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Scanning {items.length} offer{items.length === 1 ? "" : "s"}</p>
          <p className="text-xs text-muted-foreground">
            {processing ? "Running each file through upload, extraction, AI analysis, verification, and save." : "Batch scan status"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {done} done · {failed} failed
        </p>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                {it.status === "processing" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                {it.status === "done" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {it.status === "error" && <XCircle className="h-5 w-5 text-risk" />}
                {it.status === "pending" && <Clock className="h-5 w-5 text-muted-foreground" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  {it.status === "done" && it.scanId && (
                    <Link to={`/results/${it.scanId}`} className="w-fit text-xs font-medium text-primary hover:underline">
                      View report
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {it.message || (it.status === "pending" ? "Queued" : it.status === "processing" ? "Working..." : "")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {layers.map((layer) => (
                    <LayerPill key={layer.key} layer={layer} activeLayer={it.layer} status={it.status} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Each finished report is saved immediately and can also be opened later from your dashboard.
      </p>
    </div>
  );
}
