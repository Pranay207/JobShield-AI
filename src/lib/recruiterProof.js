const FREE_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com", "proton.me"]);
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const LINKEDIN_PROFILE_RE = /linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+/i;
const CAREERS_RE = /(?:careers|jobs|workdayjobs|greenhouse|lever|smartrecruiters|naukri|indeed|linkedin\.com\/jobs)/i;
const PRIVATE_CHAT_RE = /whatsapp|telegram|t\.me|dm me|message me|personal number/i;
const PAYMENT_RE = /(registration|training|security|processing|refundable|equipment|joining|activation).{0,35}(fee|charge|deposit|amount|payment)|pay\s*(rs\.?|inr)?\s*\d+/i;
const DOC_RE = /aadhaar|aadhar|pan card|bank details|account number|ifsc|passport photo|selfie|otp/i;
const URGENCY_RE = /urgent|today only|last chance|immediately|limited seats|reply fast/i;

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
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

function extractEmails(text) {
  return unique([...String(text || "").matchAll(EMAIL_RE)].map((match) => match[0].toLowerCase()));
}

function extractDomains(text) {
  return unique([...String(text || "").matchAll(EMAIL_RE)].map((match) => match[1].toLowerCase()));
}

function check(label, status, points, detail, evidence = "") {
  return { label, status, points, detail, evidence };
}

export function buildRecruiterProof(scan = {}) {
  const text = scan.raw_text || "";
  const emails = extractEmails(text);
  const domains = extractDomains(text);
  const officialDomains = domains.filter((domain) => !FREE_DOMAINS.has(domain));
  const freeEmails = emails.filter((email) => FREE_DOMAINS.has(email.split("@")[1]));
  const companyName = scan.company_name || scan.recruiter_identity?.claimed_company || "";
  const companyKey = companySlug(companyName);
  const matchedDomain = officialDomains.find((domain) => {
    const slug = domainSlug(domain);
    return companyKey && slug && (companyKey.includes(slug) || slug.includes(companyKey.slice(0, 5)));
  });
  const linkedinProof = String(text).match(LINKEDIN_PROFILE_RE)?.[0] || scan.recruiter_identity?.linkedin_profile || "";
  const hasCareerProof = CAREERS_RE.test(text);
  const privateChat = PRIVATE_CHAT_RE.test(text);
  const payment = PAYMENT_RE.test(text);
  const docs = DOC_RE.test(text);
  const urgency = URGENCY_RE.test(text);
  const aiIdentity = scan.recruiter_identity || {};

  const checks = [
    check(
      "Company-domain email",
      matchedDomain ? "pass" : officialDomains.length ? "warn" : freeEmails.length ? "fail" : "warn",
      matchedDomain ? 25 : officialDomains.length ? 12 : 0,
      matchedDomain
        ? "Recruiter email domain appears aligned with the claimed company."
        : officialDomains.length
          ? "An official-looking domain is present, but it does not clearly match the company name."
          : freeEmails.length
            ? "Hiring message uses a free email domain, which is weak recruiter proof."
            : "No recruiter email proof was found.",
      matchedDomain || officialDomains[0] || freeEmails[0] || ""
    ),
    check(
      "Recruiter/profile proof",
      linkedinProof ? "pass" : "warn",
      linkedinProof ? 18 : 6,
      linkedinProof
        ? "A LinkedIn profile/company proof link is present."
        : "No LinkedIn recruiter/company proof was included. Ask for a verifiable profile.",
      linkedinProof
    ),
    check(
      "Official job listing proof",
      hasCareerProof ? "pass" : "warn",
      hasCareerProof ? 18 : 5,
      hasCareerProof
        ? "Message includes a career/job listing signal that can be manually verified."
        : "No official careers-page or job listing proof was detected.",
      hasCareerProof ? "career/job link signal found" : ""
    ),
    check(
      "Off-platform pressure",
      privateChat ? "fail" : "pass",
      privateChat ? 0 : 14,
      privateChat
        ? "Message pushes WhatsApp/Telegram/personal chat before proof is established."
        : "No private-chat pressure detected.",
      privateChat ? "WhatsApp/Telegram/personal chat signal" : ""
    ),
    check(
      "Money/doc safety",
      payment || docs ? "fail" : "pass",
      payment || docs ? 0 : 15,
      payment
        ? "Payment or fee demand appears before recruiter proof."
        : docs
          ? "Sensitive document or OTP/bank-detail request appears before recruiter proof."
          : "No early payment or sensitive-document demand detected.",
      payment ? "payment/fee signal" : docs ? "document/OTP signal" : ""
    ),
    check(
      "AI identity consistency",
      aiIdentity.status === "Verified Recruiter" ? "pass" : aiIdentity.status === "Impersonation Risk" ? "fail" : "warn",
      aiIdentity.status === "Verified Recruiter" ? 10 : aiIdentity.status === "Impersonation Risk" ? 0 : 5,
      aiIdentity.verdict || "Recruiter identity needs manual confirmation through official company channels.",
      aiIdentity.status || ""
    )
  ];

  const penalty = urgency ? 6 : 0;
  const score = Math.max(0, Math.min(100, checks.reduce((sum, item) => sum + item.points, 0) - penalty));
  const status = score >= 75 ? "Proof Strong" : score >= 45 ? "Needs Manual Proof" : "Impersonation Risk";
  const nextStep = score >= 75
    ? "Still verify the role on the official company careers page before sharing documents."
    : score >= 45
      ? "Ask for company-domain email, official job listing, and recruiter LinkedIn proof before continuing."
      : "Do not pay or share documents. Treat this recruiter as unverified until official proof is provided.";

  return {
    score,
    status,
    companyName,
    emails,
    checks,
    penalty,
    nextStep
  };
}
