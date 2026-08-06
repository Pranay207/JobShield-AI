import React, { useState } from "react";
import { FileSearch, ScanLine, Upload } from "lucide-react";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import OfferDnaCard from "@/components/jobshield/OfferDnaCard";

export default function OfferDna() {
  const [text, setText] = useState("");
  const [scan, setScan] = useState(null);

  const run = () => {
    if (text.trim().length < 20) return;
    setScan({ raw_text: text.trim(), offer_dna: null });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileSearch className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight font-heading">OfferDNA</h1>
              <p className="text-sm text-muted-foreground">Find hidden fees, bonds, penalties, unpaid training, and document traps.</p>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the offer letter or contract clauses here..."
              className="min-h-[260px] resize-y"
            />
            <Button onClick={run} className="mt-4 w-full" size="lg" disabled={text.trim().length < 20}>
              <ScanLine className="mr-2 h-5 w-5" />
              Parse contract risk
            </Button>
          </section>

          {!scan && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-muted-foreground">
              <Upload className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <span>For PDF or screenshot upload, use Check an Offer. This page is optimized for a quick clause-by-clause demo with pasted offer text.</span>
            </div>
          )}

          {scan && <OfferDnaCard scan={scan} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
