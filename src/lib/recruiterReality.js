import { supabase } from "@/api/supabaseClient";

const FREE_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com", "proton.me"]);
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;
const LINKEDIN_RE = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
const MESSAGING_RE = /whatsapp|telegram|t\.me|message me|dm me|personal number/i;

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
}

function extractRecruiterName(text) {
  const patterns = [
    /(?:regards|thanks|from|hr|recruiter|contact person)\s*[:,-]?\s*([A-Z][A-Za-z .]{2,40})/i,
    /(?:my name is|this is)\s+([A-Z][A-Za-z .]{2,40})/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  }
  return "";
}

function companySlug(companyName = "") {
  return companyName
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|inc|company|technologies|technology|services|solutions)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function domainSlug(domain = "") {
  return domain.split(".")[0].replace(/[^a-z0-9]/g, "").toLowerCase();
}

function status(score) {
  if (score >= 75) return "Verified Recruiter";
  if (score >= 45) return "Needs Manual Proof";
  return "Impersonation Risk";
}

export function fallbackRecruiterReality(text, scan = {}) {
  const emails = unique([...String(text || "").matchAll(EMAIL_RE)].map((match) => match[0].toLowerCase()));
  const domains = unique([...String(text || "").matchAll(EMAIL_RE)].map((match) => match[1].toLowerCase()));
  const phones = unique(String(text || "").match(PHONE_RE) || []);
  const freeEmails = emails.filter((email) => FREE_DOMAINS.has(email.split("@")[1]));
  const company = scan.company_name || "";
  const companyKey = companySlug(company);
  const officialDomains = domains.filter((domain) => !FREE_DOMAINS.has(domain));
  const matchedDomain = officialDomains.find((domain) => companyKey && (companyKey.includes(domainSlug(domain)) || domainSlug(domain).includes(companyKey.slice(0, 5))));
  const linkedin = String(text || "").match(LINKEDIN_RE)?.[0] || "";
  const usesMessaging = MESSAGING_RE.test(text || "");

  const checks = [
    {
      label: "Company email domain",
      status: matchedDomain ? "pass" : officialDomains.length ? "warn" : freeEmails.length ? "fail" : "warn",
      detail: matchedDomain || officialDomains[0] || freeEmails[0] || "No recruiter email found"
    },
    {
      label: "Free email risk",
      status: freeEmails.length ? "fail" : emails.length ? "pass" : "warn",
      detail: freeEmails.length ? "Free email used for hiring" : emails.length ? "No free email detected" : "No email detected"
    },
    {
      label: "LinkedIn proof",
      status: linkedin ? "pass" : "warn",
      detail: linkedin || "No LinkedIn profile included"
    },
    {
      label: "Messaging channel",
      status: usesMessaging ? "fail" : "pass",
      detail: usesMessaging ? "Pushes WhatsApp/Telegram/personal chat" : "No personal-chat pressure found"
    },
    {
      label: "Phone identity",
      status: phones.length ? "warn" : "pass",
      detail: phones.length ? `${phones.length} phone number${phones.length === 1 ? "" : "s"} found` : "No phone-only hiring signal"
    }
  ];

  const score = Math.max(0, Math.min(100, checks.reduce((sum, check) => {
    if (check.status === "pass") return sum + 22;
    if (check.status === "warn") return sum + 10;
    return sum;
  }, matchedDomain ? 8 : 0)));

  return {
    score,
    status: status(score),
    recruiter_name: extractRecruiterName(text),
    claimed_company: company,
    emails,
    phones,
    linkedin_profile: linkedin,
    checks,
    verdict: score >= 75
      ? "Recruiter signals are consistent, but final confirmation should still come from official HR channels."
      : score >= 45
        ? "Recruiter identity is not fully proven. Ask for official company-domain confirmation."
        : "This may be an impersonator using weak or risky identity signals."
  };
}

async function invokeRecruiterReality(text, scan) {
  const { data, error } = await supabase.functions.invoke("jobshield-ai", {
    body: {
      action: "recruiter_reality",
      text,
      companyName: scan?.company_name || "",
      verification: scan?.company_verification || null
    }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function analyzeRecruiterReality(text, scan = {}) {
  if (!text || text.trim().length < 20) return fallbackRecruiterReality(text || "", scan);
  try {
    return await invokeRecruiterReality(text, scan);
  } catch (error) {
    console.warn("Recruiter Reality AI unavailable, using local scorer:", error);
    return fallbackRecruiterReality(text, scan);
  }
}
