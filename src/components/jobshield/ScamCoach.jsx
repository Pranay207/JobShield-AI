import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, Bot, User as UserIcon } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Why is this offer risky?",
  "How should I reply to the recruiter?",
  "What documents should I avoid sharing?",
  "How do I report this to cybercrime.gov.in?"
];

export default function ScamCoach({ scan }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const buildContext = () => {
    const flags = (scan.red_flags || []).map((f) => `- ${f.title}: ${f.description}`).join("\n");
    return `You are JobShield Coach, an anti-scam assistant for Indian job seekers.
A user just scanned a job offer. Here is the verdict:
Risk score: ${scan.risk_score}/100 (${scan.risk_level})
Summary: ${scan.summary || ""}
Company: ${scan.company_name || "Unknown"}
Red flags:
${flags || "None listed"}
Recommendations: ${(scan.recommendations || []).join("; ") || "None"}

Answer the user's follow-up question clearly and briefly in English. Be helpful, practical and calm. If they ask how to report, mention cybercrime.gov.in (1930 helpline) and the nearest cyber crime cell. Never recommend paying any fee. If they ask something unrelated to job scams, gently steer back.`;
  };

  const ask = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("jobshield-ai", {
        body: { action: "coach", context: buildContext(), question: q }
      });
      if (error || data?.error) throw error || new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.answer || "Sorry, I couldn't process that." }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the coach right now. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold font-heading">Ask the JobShield Coach</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Still unsure? Ask follow-up questions about this offer — why it's risky, how to respond, or how to report it.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-3">
              <MessageSquare className="mr-2 h-4 w-4" /> Start chatting
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold font-heading">JobShield Coach</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
      </div>

      <div ref={scrollRef} className="max-h-72 min-h-[120px] space-y-3 overflow-y-auto rounded-xl bg-muted/40 p-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
              {m.content}
            </div>
            {m.role === "user" && <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <Bot className="mt-0.5 h-4 w-4 text-primary" />
            <div className="rounded-2xl bg-background border border-border px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
          placeholder="Ask a follow-up question…"
          className="min-h-[44px] resize-none"
        />
        <Button onClick={() => ask()} disabled={busy || !input.trim()} className="self-end">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}




