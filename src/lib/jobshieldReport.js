import { jsPDF } from "jspdf";

const NAVY = [26, 45, 77];      // #1a2d4d
const NAVY_DARK = [12, 24, 44];
const RISK_RED = [204, 51, 51];
const RISK_AMBER = [204, 138, 22];
const RISK_GREEN = [22, 120, 75];
const MUTED = [110, 120, 140];

function levelColor(level) {
  if (!level) return NAVY;
  if (level.startsWith("High")) return RISK_RED;
  if (level.startsWith("Medium")) return RISK_AMBER;
  return RISK_GREEN;
}

export function generateEvidenceReport(scan) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 0;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("JobShield", M, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Verify before you trust. Protect before you pay.", M, 64);
  doc.setFontSize(9);
  doc.text("AI-assisted job-offer scam analysis — Evidence Report", M, 80);

  y = 120;
  doc.setTextColor(...NAVY_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Scan Summary", M, y);
  y += 8;
  doc.setDrawColor(220, 224, 232);
  doc.line(M, y, W - M, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const dateStr = new Date(scan.created_date || Date.now()).toLocaleString();
  doc.text(`Report ID: ${scan.id}`, M, y);
  doc.text(`Generated: ${dateStr}`, W - M - 180, y, { align: "left" });
  if (scan.language_detected) {
    y += 16;
    doc.text(`Detected language: ${scan.language_detected}`, M, y);
  }
  y += 8;

  // Risk score box
  const boxY = y + 14;
  doc.setFillColor(245, 247, 251);
  doc.roundedRect(M, boxY, W - 2 * M, 64, 6, 6, "F");
  const col = levelColor(scan.risk_level);
  doc.setTextColor(...col);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(`${Math.round(scan.risk_score ?? 0)}/100`, M + 20, boxY + 42);
  doc.setFontSize(13);
  doc.text(scan.risk_level || "Unknown", M + 160, boxY + 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Risk Score", M + 160, boxY + 48);
  y = boxY + 84;

  // Summary
  doc.setTextColor(...NAVY_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Verdict Summary", M, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...[40, 44, 60]);
  const summaryLines = doc.splitTextToSize(scan.summary || "No summary available.", W - 2 * M);
  doc.text(summaryLines, M, y);
  y += summaryLines.length * 13 + 18;

  // Red flags
  ensureSpace(doc, y, 80, M, H, () => (y = M + 24));
  doc.setTextColor(...NAVY_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Red Flags Detected (${(scan.red_flags || []).length})`, M, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  (scan.red_flags || []).forEach((flag, i) => {
    const sevColor = flag.severity === "high" ? RISK_RED : flag.severity === "medium" ? RISK_AMBER : RISK_GREEN;
    const block = [
      `${i + 1}. ${flag.title || flag.type}  [${(flag.severity || "low").toUpperCase()}]`,
      ...(flag.description ? doc.splitTextToSize(flag.description, W - 2 * M) : []),
      ...(flag.evidence ? doc.splitTextToSize(`" ${flag.evidence} "`, W - 2 * M) : [])
    ];
    const blockH = block.length * 12 + 8;
    if (y + blockH > H - M - 60) {
      doc.addPage();
      y = M + 20;
    }
    doc.setTextColor(...sevColor);
    doc.setFont("helvetica", "bold");
    doc.text(block[0], M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...[60, 66, 84]);
    for (let l = 1; l < block.length; l++) {
      y += 12;
      doc.text(block[l], M + 14, y);
    }
    y += 20;
  });

  // Company verification
  if (scan.company_verification) {
    const v = scan.company_verification;
    if (y > H - M - 120) {
      doc.addPage();
      y = M + 20;
    }
    doc.setTextColor(...NAVY_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Company Verification", M, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const rows = [
      `Company: ${scan.company_name || "—"}`,
      `MCA status: ${v.mca_status || "Uncertain"}`,
      `GST status: ${v.gst_status || "Uncertain"}`,
      `Domain check: ${v.domain_check || "Not Found"}`,
      `Blacklist check: ${v.blacklist_check || "Uncertain"}`,
      `Overall verified: ${v.is_verified ? "Yes" : "No"}`,
      ...(v.notes ? doc.splitTextToSize(`Notes: ${v.notes}`, W - 2 * M) : [])
    ];
    rows.forEach((r) => {
      if (y > H - M - 60) {
        doc.addPage();
        y = M + 20;
      }
      doc.text(r, M, y);
      y += 14;
    });
    y += 10;
  }

  // Recommendations
  if (scan.recommendations && scan.recommendations.length) {
    if (y > H - M - 120) {
      doc.addPage();
      y = M + 20;
    }
    doc.setTextColor(...NAVY_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Recommendations", M, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    scan.recommendations.forEach((rec, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, W - 2 * M);
      if (y + lines.length * 13 > H - M - 60) {
        doc.addPage();
        y = M + 20;
      }
      doc.text(lines, M, y);
      y += lines.length * 13 + 4;
    });
  }

  // Offer text
  if (scan.raw_text) {
    if (y > H - M - 120) {
      doc.addPage();
      y = M + 20;
    }
    y += 8;
    doc.setTextColor(...NAVY_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Original Offer Text", M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...[60, 66, 84]);
    const textLines = doc.splitTextToSize(scan.raw_text, W - 2 * M);
    textLines.forEach((line) => {
      if (y > H - M - 40) {
        doc.addPage();
        y = M + 20;
      }
      doc.text(line, M, y);
      y += 12;
    });
  }

  // Cybercrime reference note
  doc.addPage();
  y = M + 20;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 56, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Reference Note for cybercrime.gov.in", M, 34);

  y = 96;
  doc.setTextColor(...[40, 44, 60]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const note = `To the National Cyber Crime Reporting Portal (cybercrime.gov.in),

I am filing a complaint regarding a suspected fraudulent job offer received on ${new Date(scan.created_date || Date.now()).toLocaleDateString()}.

Summary of AI-assisted analysis (generated by JobShield):
- Risk score: ${Math.round(scan.risk_score ?? 0)}/100  (${scan.risk_level || "Unknown"})
- Company referenced: ${scan.company_name || "Not clearly identified"}
- Number of red flags detected: ${(scan.red_flags || []).length}

Key red flags:
${(scan.red_flags || []).slice(0, 6).map((f, i) => `  ${i + 1}. ${f.title || f.type} — ${f.description || ""}`).join("\n")}

Company verification:
- MCA status: ${scan.company_verification?.mca_status || "Uncertain"}
- GST status: ${scan.company_verification?.gst_status || "Uncertain"}
- Overall verified: ${scan.company_verification?.is_verified ? "Yes" : "No"}

I request an investigation into this offer under the applicable provisions of the Information Technology Act, 2000, the BNS, and other relevant cybercrime statutes. The full analysis and the original offer text are attached in this report for reference.

Submitted via JobShield.`;
  const noteLines = doc.splitTextToSize(note, W - 2 * M);
  doc.text(noteLines, M, y);
  y += noteLines.length * 13 + 30;

  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const disclaimer = doc.splitTextToSize(
    "Disclaimer: This report is generated by an AI-assisted tool and is an aid, not legal advice or an official verification. Company verification uses public web signals and available verification clues. Always exercise independent judgement.",
    W - 2 * M
  );
  doc.text(disclaimer, M, y);

  // Footer page numbers
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`JobShield Evidence Report — Page ${p} of ${pages}`, W / 2, H - 24, { align: "center" });
  }

  doc.save(`JobShield-Evidence-${(scan.id || "report").slice(0, 8)}.pdf`);
}

function ensureSpace(doc, y, needed, M, H, onNewPage) {
  if (y + needed > H - M) {
    doc.addPage();
    return onNewPage();
  }
  return y;
}

