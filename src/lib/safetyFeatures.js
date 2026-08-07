import { api } from "@/api/supabaseClient";
import { extractScamFingerprint } from "@/lib/scamFingerprint";

const PAYMENT_RE = /(registration|training|security|processing|refundable|equipment|joining|activation|uniform|id card|document).{0,35}(fee|charge|deposit|amount|payment|pay)|pay\s*(rs\.?|inr|₹)?\s*\d+/i;
const DOC_RE = /aadhaar|aadhar|pan card|bank details|account number|ifsc|passport photo|selfie|photo/i;
const OFFICIAL_EMAIL_RE = /[a-z0-9._%+-]+@([a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?)/gi;
const FREE_EMAIL_RE = /@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/i;

function safeList(value) {
  return Array.isArray(value) ? value : [];
}

function hasFlag(scan, terms) {
  return safeList(scan?.red_flags).some((flag) => {
    const haystack = `${flag.type || ""} ${flag.title || ""} ${flag.description || ""} ${flag.evidence || ""}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}

function moneyMention(text) {
  const match = String(text || "").match(/(?:rs\.?|inr|₹)\s*\d[\d,]*/i) || String(text || "").match(/\bpay\s+\d[\d,]*/i);
  return match?.[0] || "";
}

export function buildPaymentGuard(scan) {
  const text = scan?.raw_text || "";
  const paymentFlag = PAYMENT_RE.test(text) || hasFlag(scan, ["payment", "fee", "deposit", "upfront"]);
  if (!paymentFlag) return null;

  return {
    level: scan?.risk_score >= 70 ? "critical" : "warning",
    amount: moneyMention(text),
    title: "Do not pay yet",
    message: "This offer asks for money before employment is safely verified. Legitimate hiring should not require a registration, training, security, equipment, or activation fee.",
    checks: [
      "Do not send UPI, bank transfer, gift cards, or wallet payment.",
      "Ask for an official email from the company domain and a no-fee confirmation.",
      "Verify the company independently before sharing documents.",
      "If money was already sent, contact 1930 and cybercrime.gov.in immediately."
    ]
  };
}

export function buildActionPlan(scan) {
  const paymentGuard = buildPaymentGuard(scan);
  const highRisk = scan?.risk_level === "High Risk" || scan?.risk_score >= 70;
  const docsRisk = DOC_RE.test(scan?.raw_text || "") || hasFlag(scan, ["document", "aadhaar", "bank"]);
  const genericEmail = FREE_EMAIL_RE.test(scan?.raw_text || "") || hasFlag(scan, ["generic email"]);
  const unverified = scan?.company_verification && !scan.company_verification.is_verified;

  const steps = [];
  if (paymentGuard) steps.push({ priority: "Now", title: "Freeze payment", text: "Do not pay any fee until the recruiter proves the role through official company channels." });
  if (docsRisk) steps.push({ priority: "Now", title: "Protect documents", text: "Do not share Aadhaar, PAN, bank details, selfies, or certificates until the employer is verified." });
  if (unverified) steps.push({ priority: "Verify", title: "Check the company", text: "Search the company independently and contact HR from the official website, not from the offer message." });
  if (genericEmail) steps.push({ priority: "Verify", title: "Demand official email", text: "Ask the recruiter to respond from a real company domain and confirm there is no fee." });
  if (highRisk) steps.push({ priority: "Report", title: "Preserve evidence", text: "Save screenshots, phone numbers, payment handles, email IDs, and this report before blocking the sender." });
  if (highRisk) steps.push({ priority: "Report", title: "File a report", text: "Report suspected fraud at cybercrime.gov.in. If money was lost, call 1930 quickly." });

  if (!steps.length) {
    steps.push(
      { priority: "Verify", title: "Confirm the source", text: "Open the official company website yourself and contact HR through listed channels." },
      { priority: "Verify", title: "Check offer basics", text: "Confirm role, salary, interview process, office address, and joining documents before trusting it." }
    );
  }

  return steps.slice(0, 6);
}

export function buildCompanyTrustGraph(scan) {
  const verification = scan?.company_verification || {};
  const fingerprint = scan?.fingerprint || extractScamFingerprint(scan?.raw_text || "", { company_name: scan?.company_name });
  const domains = fingerprint.domains || [];
  const emails = fingerprint.emails || [];
  const hasOfficialEmail = emails.some((email) => !FREE_EMAIL_RE.test(email));

  const nodes = [
    {
      label: "Registry",
      status: verification.mca_status === "Verified" ? "pass" : verification.mca_status === "Not Found" ? "fail" : "warn",
      detail: verification.mca_status || "Uncertain"
    },
    {
      label: "Tax/GST",
      status: verification.gst_status === "Verified" ? "pass" : verification.gst_status === "Not Found" ? "fail" : "warn",
      detail: verification.gst_status || "Uncertain"
    },
    {
      label: "Domain",
      status: verification.domain_check === "Legitimate" || hasOfficialEmail || domains.length ? "pass" : verification.domain_check === "Suspicious" || verification.domain_check === "Not Found" ? "fail" : "warn",
      detail: domains[0] || verification.domain_check || "Uncertain"
    },
    {
      label: "Recruiter email",
      status: hasOfficialEmail ? "pass" : FREE_EMAIL_RE.test(scan?.raw_text || "") ? "fail" : "warn",
      detail: hasOfficialEmail ? emails.find((email) => !FREE_EMAIL_RE.test(email)) : FREE_EMAIL_RE.test(scan?.raw_text || "") ? "Free email" : "Not found"
    },
    {
      label: "Blacklist",
      status: verification.blacklist_check === "Clear" ? "pass" : verification.blacklist_check === "Flagged" ? "fail" : "warn",
      detail: verification.blacklist_check || "Uncertain"
    }
  ];

  const score = nodes.reduce((sum, node) => sum + (node.status === "pass" ? 20 : node.status === "warn" ? 8 : 0), 0);
  return {
    score,
    verdict: score >= 75 ? "Verified signal strength" : score >= 45 ? "Needs manual verification" : "Weak trust signals",
    nodes
  };
}

function reportText(report) {
  return `${report.company_name || ""} ${report.scam_type || ""} ${report.channel || ""} ${report.description || ""}`;
}

function overlap(left = [], right = []) {
  const rightSet = new Set(right.map((value) => String(value).toLowerCase()));
  return left.filter((value) => rightSet.has(String(value).toLowerCase()));
}

async function apiSafeList(entityName, order, limit) {
  try {
    return await api.entities[entityName].list(order, limit);
  } catch {
    return [];
  }
}

export async function buildCommunityAlert(scan) {
  const fingerprint = scan?.fingerprint || extractScamFingerprint(scan?.raw_text || "", { company_name: scan?.company_name });
  const [scans, reports] = await Promise.all([
    apiSafeList("Scan", "-created_date", 200),
    apiSafeList("CommunityReport", "-created_date", 200)
  ]);

  const matches = [];
  const currentCompanies = (fingerprint.company_names || []).map((value) => value.toLowerCase());

  for (const item of scans.filter((item) => item.id !== scan?.id && item.risk_level === "High Risk")) {
    const other = item.fingerprint || extractScamFingerprint(item.raw_text || "", { company_name: item.company_name });
    const reasons = [
      overlap(fingerprint.phones, other.phones).length && "same phone",
      overlap(fingerprint.upi_ids, other.upi_ids).length && "same UPI",
      overlap(fingerprint.emails, other.emails).length && "same email",
      overlap(currentCompanies, (other.company_names || []).map((value) => value.toLowerCase())).length && "same company name"
    ].filter(Boolean);
    if (reasons.length) matches.push({ source: "scan", reasons, name: item.company_name || "Unknown company" });
  }

  for (const report of reports) {
    const other = extractScamFingerprint(reportText(report), { company_name: report.company_name });
    const reasons = [
      overlap(fingerprint.phones, other.phones).length && "reported phone",
      overlap(fingerprint.upi_ids, other.upi_ids).length && "reported UPI",
      overlap(fingerprint.emails, other.emails).length && "reported email",
      overlap(currentCompanies, (other.company_names || []).map((value) => value.toLowerCase())).length && "reported company"
    ].filter(Boolean);
    if (reasons.length) matches.push({ source: "report", reasons, name: report.company_name || report.scam_type || "Community report" });
  }

  const riskBoost = scan?.risk_level === "High Risk" ? 1 : 0;
  const alertLevel = matches.length + riskBoost >= 3 ? "active" : matches.length ? "watch" : "quiet";

  return {
    alertLevel,
    matches: matches.slice(0, 6),
    matchCount: matches.length,
    headline: alertLevel === "active"
      ? "Community alert: similar scam pattern detected"
      : alertLevel === "watch"
        ? "Community watch: related signals found"
        : "No community alert yet"
  };
}

export function buildRadarAlerts(scans = [], reports = []) {
  const counts = new Map();

  for (const scan of scans.filter((item) => item.risk_level === "High Risk")) {
    const fp = scan.fingerprint || extractScamFingerprint(scan.raw_text || "", { company_name: scan.company_name });
    for (const company of fp.company_names || []) {
      const key = company.toLowerCase();
      if (!key) continue;
      counts.set(key, { label: company, count: (counts.get(key)?.count || 0) + 1, type: "High-risk scans" });
    }
  }

  for (const report of reports) {
    const key = String(report.company_name || report.scam_type || "").toLowerCase();
    if (!key) continue;
    counts.set(key, { label: report.company_name || report.scam_type, count: (counts.get(key)?.count || 0) + 1, type: "Community reports" });
  }

  return [...counts.values()]
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function textHas(scan, regex) {
  return regex.test(scan?.raw_text || "");
}

function flagHas(scan, terms) {
  return hasFlag(scan, terms);
}

function trustItem(key, title, status, label, detail) {
  return { key, title, status, label, detail };
}

export function buildTrustPath(scan) {
  const text = scan?.raw_text || "";
  const payment = PAYMENT_RE.test(text) || flagHas(scan, ["payment", "fee", "deposit", "upfront"]);
  const docs = DOC_RE.test(text) || flagHas(scan, ["document", "aadhaar", "aadhar", "pan", "bank"]);
  const privateChat = textHas(scan, /whatsapp|telegram|t\.me|dm me|message me|personal number/i) || flagHas(scan, ["whatsapp", "telegram", "messaging"]);
  const freeEmail = FREE_EMAIL_RE.test(text) || flagHas(scan, ["generic email", "free email"]);
  const urgency = textHas(scan, /urgent|today only|last chance|immediately|limited seats|reply fast/i) || flagHas(scan, ["urgency", "pressure"]);
  const noInterview = textHas(scan, /without interview|no interview|direct joining|guaranteed job|selected without/i) || flagHas(scan, ["interview", "direct joining"]);
  const hasCompany = Boolean(scan?.company_name);
  const verified = Boolean(scan?.company_verification?.is_verified);
  const risk = Number(scan?.risk_score || 0);

  return [
    trustItem(
      "contact",
      "First contact",
      privateChat || urgency ? "watch" : "safe",
      privateChat || urgency ? "Watch" : "Clean",
      privateChat
        ? "Conversation moved to WhatsApp/Telegram or a personal channel, which is common in job scams."
        : urgency
          ? "The message uses urgency pressure. Slow down and verify before replying."
          : "No strong private-channel or urgency signal found in the first-contact text."
    ),
    trustItem(
      "recruiter",
      "Recruiter identity",
      freeEmail ? "danger" : scan?.recruiter_identity?.status === "Impersonation Risk" ? "danger" : "watch",
      freeEmail || scan?.recruiter_identity?.status === "Impersonation Risk" ? "Risk" : "Verify",
      freeEmail
        ? "Recruiter appears to use a free email domain instead of an official company domain."
        : scan?.recruiter_identity?.verdict || "Ask for official company-domain email proof and a LinkedIn/company profile match."
    ),
    trustItem(
      "offer",
      "Offer proof",
      noInterview ? "danger" : hasCompany ? "watch" : "danger",
      noInterview ? "Risk" : hasCompany ? "Check" : "Weak",
      noInterview
        ? "The offer suggests direct joining or hiring without a real interview process."
        : hasCompany
          ? `Claimed company: ${scan.company_name}. Verify using the official website, not the message link.`
          : "No clear company name was detected, so the offer has weak identity proof."
    ),
    trustItem(
      "payment",
      "Money request",
      payment ? "danger" : "safe",
      payment ? "Stop" : "None",
      payment
        ? "Payment, fee, deposit, training, equipment, or activation demand detected. Do not pay before independent verification."
        : "No upfront payment demand was detected in the scanned text."
    ),
    trustItem(
      "documents",
      "Document safety",
      docs ? "danger" : "safe",
      docs ? "Stop" : "Safe",
      docs
        ? "Sensitive document or bank-detail request detected. Do not share Aadhaar, PAN, bank details, selfies, or OTPs."
        : "No early sensitive-document request was detected."
    ),
    trustItem(
      "decision",
      "Final decision",
      risk >= 70 ? "danger" : risk >= 40 ? "watch" : verified ? "safe" : "watch",
      risk >= 70 ? "Reject" : risk >= 40 ? "Pause" : verified ? "Proceed" : "Verify",
      risk >= 70
        ? "High-risk verdict. Preserve evidence, block payment, and report if money or documents were shared."
        : risk >= 40
          ? "Medium-risk verdict. Do not proceed until recruiter, company, role, and payment terms are independently verified."
          : verified
            ? "Low-risk scan with verified company signals. Still confirm through official channels."
            : "Low-risk scan, but company verification is not conclusive. Complete manual verification."
    )
  ];
}

