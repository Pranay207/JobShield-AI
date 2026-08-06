import { api } from "@/api/supabaseClient";
const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const UPI_RE = /\b[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}\b/g;
const TELEGRAM_RE = /(?:t\.me\/|telegram(?:\s+id|\s+handle)?\s*[:\-]?\s*@?)([a-zA-Z0-9_]{5,})/gi;
const DOMAIN_RE = /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)\b/g;

const GENERIC_EMAIL_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com']);
const COMMON_DOMAINS = new Set([...GENERIC_EMAIL_DOMAINS, 'linkedin.com', 'telegram.org', 'whatsapp.com', 'wa.me']);

function unique(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()).filter(Boolean))];
}

function normalizePhone(value) {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.length === 10 ? digits : null;
}

function normalizeDomain(value) {
  return String(value).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

function templateSignature(text) {
  return text
    .toLowerCase()
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' email ')
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}\b/g, ' phone ')
    .replace(/\b\d{2,}\b/g, ' number ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 80)
    .join(' ');
}

function jaccard(a, b) {
  const left = new Set(String(a || '').split(/\s+/).filter(Boolean));
  const right = new Set(String(b || '').split(/\s+/).filter(Boolean));
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

export function extractScamFingerprint(text, analysis = {}) {
  const phones = unique([...(text.match(PHONE_RE) || []).map(normalizePhone)]);
  const emails = unique(text.match(EMAIL_RE) || []).map((email) => email.toLowerCase());
  const upiIds = unique(text.match(UPI_RE) || [])
    .map((upi) => upi.toLowerCase())
    .filter((upi) => !emails.includes(upi));
  const telegramHandles = unique([...text.matchAll(TELEGRAM_RE)].map((m) => m[1]?.toLowerCase()));
  const domains = unique([...text.matchAll(DOMAIN_RE)].map((m) => normalizeDomain(m[1])))
    .filter((domain) => !COMMON_DOMAINS.has(domain) && !domain.includes('@'));
  const emailDomains = unique(emails.map((email) => email.split('@')[1]).filter((domain) => !GENERIC_EMAIL_DOMAINS.has(domain)));

  return {
    phones,
    emails,
    upi_ids: upiIds,
    telegram_handles: telegramHandles,
    domains: unique([...domains, ...emailDomains]),
    company_names: unique([analysis.company_name]),
    template_signature: templateSignature(text),
  };
}

function countMatches(currentValues, records, getter) {
  const needles = new Set(currentValues || []);
  if (!needles.size) return 0;
  return records.filter((record) => getter(record).some((value) => needles.has(value))).length;
}

function reportText(report) {
  return `${report.company_name || ''} ${report.description || ''} ${report.channel || ''}`;
}

function scanFingerprint(scan) {
  if (scan.fingerprint) return scan.fingerprint;
  return extractScamFingerprint(scan.raw_text || '', { company_name: scan.company_name });
}

export async function buildFingerprintIntel(scan) {
  const fingerprint = scan.fingerprint || extractScamFingerprint(scan.raw_text || '', { company_name: scan.company_name });
  const [scans, reports] = await Promise.all([
    apiSafeList('Scan', '-created_date', 200),
    apiSafeList('CommunityReport', '-created_date', 200),
  ]);

  const otherScans = scans.filter((item) => item.id !== scan.id);
  const highRiskScans = otherScans.filter((item) => item.risk_level === 'High Risk');
  const reportFingerprints = reports.map((report) => ({ ...report, fingerprint: extractScamFingerprint(reportText(report), { company_name: report.company_name }) }));

  const phoneMatches = countMatches(fingerprint.phones, highRiskScans, (item) => scanFingerprint(item).phones || []) +
    countMatches(fingerprint.phones, reportFingerprints, (item) => item.fingerprint.phones || []);
  const emailMatches = countMatches(fingerprint.emails, highRiskScans, (item) => scanFingerprint(item).emails || []) +
    countMatches(fingerprint.emails, reportFingerprints, (item) => item.fingerprint.emails || []);
  const upiMatches = countMatches(fingerprint.upi_ids, highRiskScans, (item) => scanFingerprint(item).upi_ids || []) +
    countMatches(fingerprint.upi_ids, reportFingerprints, (item) => item.fingerprint.upi_ids || []);
  const companyMatches = countMatches(fingerprint.company_names.map((v) => v.toLowerCase()), highRiskScans, (item) => (scanFingerprint(item).company_names || []).map((v) => v.toLowerCase())) +
    countMatches(fingerprint.company_names.map((v) => v.toLowerCase()), reportFingerprints, (item) => (item.fingerprint.company_names || []).map((v) => v.toLowerCase()));

  const templateMatches = otherScans
    .map((item) => ({ item, score: jaccard(fingerprint.template_signature, scanFingerprint(item).template_signature) }))
    .filter(({ score }) => score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const signals = [
    fingerprint.phones.length && { type: 'phone', label: 'Contact reuse', value: fingerprint.phones[0], count: phoneMatches, detail: phoneMatches ? `Seen in ${phoneMatches} suspicious scan/report record${phoneMatches === 1 ? '' : 's'}.` : 'No matching suspicious records found yet.' },
    fingerprint.upi_ids.length && { type: 'upi', label: 'Payment trail', value: fingerprint.upi_ids[0], count: upiMatches, detail: upiMatches ? `UPI ID linked to ${upiMatches} suspicious record${upiMatches === 1 ? '' : 's'}.` : 'No matching UPI trail found yet.' },
    fingerprint.emails.length && { type: 'email', label: 'Email identity', value: fingerprint.emails[0], count: emailMatches, detail: emailMatches ? `Email reused in ${emailMatches} suspicious record${emailMatches === 1 ? '' : 's'}.` : 'No matching email reuse found yet.' },
    fingerprint.company_names.length && { type: 'company', label: 'Company name pattern', value: fingerprint.company_names[0], count: companyMatches, detail: companyMatches ? `Company/name appears in ${companyMatches} suspicious record${companyMatches === 1 ? '' : 's'}.` : 'No matching company reports found yet.' },
    templateMatches.length && { type: 'template', label: 'Message template match', value: `${Math.round(templateMatches[0].score * 100)}% similar`, count: templateMatches.length, detail: `Similar to ${templateMatches.length} previous scan${templateMatches.length === 1 ? '' : 's'}.` },
  ].filter(Boolean);

  const score = signals.reduce((sum, signal) => sum + Math.min(30, (signal.count || 0) * 10), 0);

  return {
    fingerprint,
    signals,
    network_score: Math.min(100, score),
    compared_records: otherScans.length + reports.length,
  };
}

async function apiSafeList(entityName, order, limit) {
  try {
    return await api.entities[entityName].list(order, limit);
  } catch {
    return [];
  }
}


