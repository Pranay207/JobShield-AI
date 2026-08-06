import React, { useState } from "react";
import { MessageCircle, ShieldAlert, ExternalLink, Loader2, Check, Share2, Link2, Twitter, Linkedin, Facebook, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from "@/api/supabaseClient";

const RISK_EMOJI = {
  "Low Risk": "🟢",
  "Medium Risk": "🟠",
  "High Risk": "🔴",
};

export default function VerdictShare({ scan }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const verdictLine = `${RISK_EMOJI[scan.risk_level] || "⚪"} Risk: ${scan.risk_level || "Unknown"} (${Math.round(scan.risk_score ?? 0)}/100)`;
  const topFlag = (scan.red_flags || [])[0];
  const companyLine = scan.company_name ? `Company: ${scan.company_name}` : "Company: not clearly identified";

  const text = `JobShield verdict — ${verdictLine}\n${companyLine}\n${topFlag ? `Top red flag: ${topFlag.title}${topFlag.evidence ? ` — "${topFlag.evidence}"` : ""}` : "No major red flags detected."}\nFull report: ${window.location.href}\n\nVerify before you trust. Protect before you pay.`;

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareUrl = window.location.href;
  const [copiedMore, setCopiedMore] = useState(false);

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "JobShield verdict", text, url: shareUrl });
      } catch { /* user cancelled — no-op */ }
      return;
    }
    copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedMore(true);
      setTimeout(() => setCopiedMore(false), 2000);
    } catch { /* no-op */ }
  };

  const openShare = (targetUrl) => window.open(targetUrl, "_blank", "noopener,noreferrer");
  const shareX = () => openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
  const shareLinkedIn = () => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
  const shareFacebook = () => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`);
  const shareEmail = () => openShare(`mailto:?subject=${encodeURIComponent("JobShield verdict")}&body=${encodeURIComponent(text)}`);
  const shareSms = () => openShare(`sms:?body=${encodeURIComponent(text)}`);

  const reportToCyber = () => {
    const summary = encodeURIComponent(
      `Suspected fraudulent job offer.\nRisk: ${scan.risk_level || "Unknown"} (${Math.round(scan.risk_score ?? 0)}/100)\nCompany: ${scan.company_name || "Not clearly identified"}\nRed flags: ${(scan.red_flags || []).length}\nTop red flag: ${topFlag ? topFlag.title : "N/A"}`
    );
    window.open(`https://cybercrime.gov.in`, "_blank", "noopener,noreferrer");
  };

  const emailMe = async () => {
    try {
      setSending(true);
      const me = await api.auth.me();
      if (!me?.email) throw new Error("no-email");
      const subject = `JobShield verdict - ${scan.risk_level || "Unknown"} (${Math.round(scan.risk_score ?? 0)}/100)`;
      const body = `Hi ${me.full_name || "there"},\n\nHere is your JobShield analysis saved on ${new Date(scan.created_date).toLocaleString()}.\n\nVerdict: ${scan.risk_level || "Unknown"} - Risk score ${Math.round(scan.risk_score ?? 0)}/100\nCompany: ${scan.company_name || "Not clearly identified"}\n\nSummary:\n${scan.summary || ""}\n\nTop red flags:\n${(scan.red_flags || []).slice(0, 5).map((f, i) => `${i + 1}. ${f.title}${f.evidence ? ` - "${f.evidence}"` : ""}`).join("\n") || "None"}\n\nFull report link: ${window.location.href}\n\nDownload the evidence PDF there to attach to your cybercrime.gov.in complaint.\n\n- JobShield`;
      window.location.href = `mailto:${encodeURIComponent(me.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } catch {
      setSending(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold font-heading">Act on this verdict</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Share the verdict, email yourself a copy, or start a complaint with the authorities.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={shareWhatsApp} className="justify-start">
          <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
          Share on WhatsApp
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-start">
              {copiedMore ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Share2 className="mr-2 h-4 w-4" />}
              {copiedMore ? "Link copied" : "More share options"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {navigator.share && (
              <DropdownMenuItem onClick={shareNative}>
                <Share2 className="mr-2 h-4 w-4" />
                Native share sheet
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={copyLink}>
              {copiedMore ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : <Link2 className="mr-2 h-4 w-4" />}
              {copiedMore ? "Copied!" : "Copy report link"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareX}>
              <Twitter className="mr-2 h-4 w-4" />
              Share on X
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareLinkedIn}>
              <Linkedin className="mr-2 h-4 w-4" />
              Share on LinkedIn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareFacebook}>
              <Facebook className="mr-2 h-4 w-4" />
              Share on Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email via my app
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareSms}>
              <Smartphone className="mr-2 h-4 w-4" />
              Send via SMS
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={emailMe} disabled={sending || sent} className="justify-start">
          {sent ? <Check className="mr-2 h-4 w-4 text-emerald-500" /> : sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {sent ? "Email sent" : sending ? "Sending…" : "Email me a copy"}
        </Button>
        <Button onClick={reportToCyber} className="justify-start">
          <ExternalLink className="mr-2 h-4 w-4" />
          Report on cybercrime.gov.in
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Email copy is sent to your registered address. The cybercrime.gov.in button opens the official portal — use the downloaded evidence PDF as your attachment.
      </p>
    </section>
  );
}


