import React, { useState } from "react";
import { Megaphone, Loader2, Send } from "lucide-react";
import { api } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SCAM_TYPES = ["Upfront payment", "Fake company", "WhatsApp / Telegram scam", "Fake recruiter", "Document fraud", "Pyramid / referral scam", "Other"];
const CHANNELS = ["WhatsApp", "Telegram", "Email", "Phone call", "SMS", "LinkedIn", "Other"];

export default function CommunityReportForm({ onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    scam_type: "Upfront payment",
    company_name: "",
    city: "",
    channel: "WhatsApp",
    amount_demanded: "",
    description: ""
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.description.trim().length < 10) {
      setError("Please describe what happened in at least a sentence.");
      return;
    }
    setBusy(true);
    try {
      await api.entities.CommunityReport.create({
        scam_type: form.scam_type,
        company_name: form.company_name.trim(),
        city: form.city.trim(),
        channel: form.channel,
        amount_demanded: form.amount_demanded ? Number(form.amount_demanded) : 0,
        description: form.description.trim()
      });
      setForm({ scam_type: "Upfront payment", company_name: "", city: "", channel: "WhatsApp", amount_demanded: "", description: "" });
      setOpen(false);
      onSubmitted?.();
    } catch (e) {
      setError(e?.message || "Could not submit your report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="lg" className="w-full h-12 text-base">
        <Megaphone className="mr-2 h-5 w-5" />
        Report a scam to the community
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-bold font-heading">Report a scam</h3>
      <p className="mt-1 text-xs text-muted-foreground">Help others spot scams faster. No personal data is required.</p>

      {error && <p className="mt-3 rounded-lg bg-risk/10 px-3 py-2 text-sm text-risk">{error}</p>}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs font-medium">Scam type</Label>
          <select
            value={form.scam_type}
            onChange={(e) => set("scam_type", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {SCAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium">Channel</Label>
          <select
            value={form.channel}
            onChange={(e) => set("channel", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium">Company / recruiter name</Label>
          <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="e.g. TechMahindra HR" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium">City</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Hyderabad" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium">Amount demanded (₹)</Label>
          <Input type="number" min="0" value={form.amount_demanded} onChange={(e) => set("amount_demanded", e.target.value)} placeholder="0" />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block text-xs font-medium">What happened?</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe how the scammer contacted you and what they asked for…"
            className="min-h-[100px] resize-y"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {busy ? "Submitting" : "Submit report"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
