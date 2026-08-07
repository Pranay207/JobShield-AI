import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, ClipboardPaste, FileText, X, ScanLine, AlertCircle, FolderOpen } from "lucide-react";
import { api } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import AnalysisSteps from "@/components/jobshield/AnalysisSteps";
import BatchProgress from "@/components/jobshield/BatchProgress";
import { uploadAndExtractText, analyzeOfferText, verifyCompany } from "@/lib/jobshieldAnalysis";
import { analyzeOfferDna } from "@/lib/offerDna";
import { analyzeRecruiterReality } from "@/lib/recruiterReality";
import { extractScamFingerprint } from "@/lib/scamFingerprint";

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "image/webp", "text/plain"];
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf", ".webp", ".txt"];

export default function Analyzer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filesInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [mode, setMode] = useState("text");
  const [pasteText, setPasteText] = useState("");
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [batchStatus, setBatchStatus] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const text = searchParams.get("text");
    if (text && text.trim().length) {
      setMode("text");
      setPasteText(text.slice(0, 12000));
    }
  }, [searchParams]);

  const addFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    const valid = arr.filter((f) => {
      const name = f.name.toLowerCase();
      return ACCEPTED.includes(f.type) || ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
    });
    if (valid.length === 0) {
      setError("No supported files found. Please upload PNG, JPG, WebP, PDF, or TXT files.");
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const buildScanPayload = (text, fileUrl, lang, analysis, verification, offerDna = null, recruiterIdentity = null) => ({
    raw_text: text,
    file_url: fileUrl || null,
    language_detected: analysis.language_detected || lang,
    risk_score: analysis.risk_score,
    risk_level: analysis.risk_level,
    summary: analysis.summary,
    company_name: analysis.company_name || "",
    red_flags: analysis.red_flags || [],
    company_verification: verification || null,
    recommendations: analysis.recommendations || [],
    fingerprint: extractScamFingerprint(text, analysis),
    offer_dna: offerDna,
    recruiter_identity: recruiterIdentity
  });

  const handleAnalyze = async () => {
    setError(null);
    if (mode === "text" && pasteText.trim().length < 20) {
      setError("Please paste the full job-offer message (at least a couple of sentences).");
      return;
    }
    if (mode === "upload" && files.length === 0) {
      setError("Please add at least one screenshot or PDF of a job offer.");
      return;
    }

    setAnalyzing(true);
    setStep(0);

    try {
      if (mode === "text") {
        const text = pasteText.trim();
        setStep(1);
        const analysis = await analyzeOfferText(text);
        setStep(2);
        let verification = null;
        if (analysis.company_name && analysis.company_name.trim().length >= 2) {
          verification = await verifyCompany(analysis.company_name.trim());
        }
        setStep(3);
        const [offerDna, recruiterIdentity] = await Promise.all([
          analyzeOfferDna(text),
          analyzeRecruiterReality(text, { ...analysis, company_verification: verification })
        ]);
        const scan = await api.entities.Scan.create(
          buildScanPayload(text, null, "English", analysis, verification, offerDna, recruiterIdentity)
        );
        navigate(`/results/${scan.id}`);
        return;
      }

      const updateBatchItem = (index, patch) => {
        setBatchStatus((prev) => prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s)));
      };

      const statuses = files.map((f) => ({ name: f.name, status: "pending", layer: "upload", message: "Queued", scanId: null }));
      setBatchStatus(statuses);
      const createdIds = [];

      for (let i = 0; i < files.length; i++) {
        try {
          updateBatchItem(i, { status: "processing", layer: "upload", message: "Uploading file to secure storage..." });
          const extracted = await uploadAndExtractText(files[i], (layer, message) => {
            updateBatchItem(i, { status: "processing", layer, message });
          });

          if (!extracted.text || extracted.text.trim().length < 20) {
            throw new Error("Could not read enough text. Try a clearer screenshot or paste the text manually.");
          }

          updateBatchItem(i, { status: "processing", layer: "analyze", message: "Running AI red-flag analysis..." });
          const analysis = await analyzeOfferText(extracted.text);

          let verification = null;
          if (analysis.company_name && analysis.company_name.trim().length >= 2) {
            updateBatchItem(i, { status: "processing", layer: "verify", message: `Checking ${analysis.company_name.trim()}...` });
            verification = await verifyCompany(analysis.company_name.trim());
          } else {
            updateBatchItem(i, { status: "processing", layer: "verify", message: "No company name found, skipping verification..." });
            await new Promise((resolve) => setTimeout(resolve, 250));
          }

          updateBatchItem(i, { status: "processing", layer: "save", message: "Parsing contract and recruiter identity..." });
          const [offerDna, recruiterIdentity] = await Promise.all([
            analyzeOfferDna(extracted.text),
            analyzeRecruiterReality(extracted.text, { ...analysis, company_verification: verification })
          ]);
          updateBatchItem(i, { status: "processing", layer: "save", message: "Saving report..." });
          const scan = await api.entities.Scan.create(
            buildScanPayload(extracted.text, extracted.file_url, extracted.language, analysis, verification, offerDna, recruiterIdentity)
          );

          createdIds.push(scan.id);
          updateBatchItem(i, {
            status: "done",
            layer: "save",
            scanId: scan.id,
            message: `${analysis.risk_level} - ${Math.round(analysis.risk_score)}/100`
          });
        } catch (e) {
          updateBatchItem(i, {
            status: "error",
            message: e?.message || "Failed to analyze"
          });
        }
      }

      if (createdIds.length === 1) {
        navigate(`/results/${createdIds[0]}`);
      } else if (createdIds.length > 1) {
        navigate("/dashboard");
      } else {
        setAnalyzing(false);
        setStep(0);
        setError("None of the files could be analyzed. The file text could not be read. Try a clearer screenshot/PDF, upload a TXT file, or paste the offer text manually.");
      }
    } catch (e) {
      setError(e?.message || "Something went wrong while analyzing the offer. Please try again.");
      setAnalyzing(false);
      setStep(0);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight font-heading sm:text-4xl">Check a job offer</h1>
            <p className="mt-3 text-muted-foreground">
              Paste the offer text, or upload screenshots, PDFs, or TXT files. We support English, Hindi & Telugu.
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-risk/30 bg-risk/10 px-4 py-3 text-sm text-risk">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {analyzing ? (
            <div className="mt-8">
              {mode === "upload" ? (
                <BatchProgress items={batchStatus} />
              ) : (
                <AnalysisSteps current={step} />
              )}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
              {/* Mode tabs */}
              <div className="mb-5 grid w-full grid-cols-2 rounded-xl border border-border bg-muted p-1 sm:inline-grid sm:w-auto">
                <button
                  onClick={() => setMode("text")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                    mode === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Paste text
                </button>
                <button
                  onClick={() => setMode("upload")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                    mode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Upload className="h-4 w-4" />
                  Upload files
                </button>
              </div>

              {mode === "text" ? (
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste the full job-offer message here - including sender, company name, salary, any fees, and contact details..."
                  className="min-h-[220px] resize-y"
                />
              ) : (
                <div>
                  {files.length > 0 ? (
                    <div>
                      <div className="space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FileText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{f.name}</p>
                              <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB · {f.type || "file"}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeFile(i)} aria-label="Remove file">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => filesInputRef.current?.click()}>
                          <Upload className="mr-1.5 h-4 w-4" /> Add more files
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => folderInputRef.current?.click()}>
                          <FolderOpen className="mr-1.5 h-4 w-4" /> Add a folder
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                          Clear all
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => filesInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors",
                        dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium">Drop screenshots or PDFs here, or tap to browse</p>
                      <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP, PDF, or TXT - you can add several at once</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                        className="mt-4 inline-flex max-w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Select a whole folder
                      </button>
                    </div>
                  )}
                  <input
                    ref={filesInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED.join(",")}
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED.join(",")}
                    webkitdirectory=""
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                  />
                </div>
              )}

              <Button onClick={handleAnalyze} size="lg" className="mt-5 w-full h-12 text-base">
                <ScanLine className="mr-2 h-5 w-5" />
                {mode === "upload" && files.length > 1
                  ? `Analyze ${files.length} offers`
                  : "Analyze offer"}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Analysis runs via AI. Company checks use public web signals and available verification clues.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}











