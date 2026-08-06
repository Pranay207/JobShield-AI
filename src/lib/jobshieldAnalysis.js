import { api, supabase } from "@/api/supabaseClient";

const FLAG_RULES = [
  { type: 'upfront_payment', title: 'Upfront payment demand', severity: 'high', score: 30, re: /(registration|training|security|processing|refundable|equipment|joining).{0,30}(fee|charge|deposit|amount|payment)|pay\s*(rs\.?|inr)?\s*\d+/i, description: 'The offer appears to ask for money before genuine employment is established.' },
  { type: 'messaging_app', title: 'Personal messaging app contact', severity: 'medium', score: 14, re: /whatsapp|telegram|msg me|message me|personal number/i, description: 'Scam recruiters often move candidates to personal chat apps instead of official channels.' },
  { type: 'generic_email', title: 'Generic email used for hiring', severity: 'medium', score: 12, re: /[a-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/i, description: 'A free email account is suspicious for official company recruitment.' },
  { type: 'unrealistic_salary', title: 'Unrealistic earning promise', severity: 'high', score: 20, re: /(earn|salary|income).{0,30}(daily|per day|2 hours|part time|work from home).{0,30}(rs\.?|inr)?\s*\d{3,}/i, description: 'The pay promise looks unusually high or easy for the described work.' },
  { type: 'no_interview', title: 'Hiring without interview', severity: 'high', score: 20, re: /without interview|no interview|direct joining|guaranteed job|selected without/i, description: 'Legitimate employers normally require a real screening or interview process.' },
  { type: 'urgency', title: 'High-pressure urgency', severity: 'medium', score: 10, re: /urgent|today only|last chance|immediately|limited seats|reply fast/i, description: 'Pressure tactics are commonly used to stop candidates from verifying details.' },
  { type: 'sensitive_docs', title: 'Sensitive documents requested early', severity: 'high', score: 18, re: /aadhaar|aadhar|pan card|bank details|account number|ifsc|passport photo/i, description: 'Requests for identity or banking documents before verification are risky.' },
  { type: 'vague_role', title: 'Vague role details', severity: 'low', score: 8, re: /data entry|simple typing|easy work|copy paste|captcha/i, description: 'Very generic work descriptions are common in job-scam scripts.' }
];

function detectLanguage(text) {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  return 'English';
}

function evidenceFor(text, re) {
  const match = text.match(re);
  if (!match) return '';
  const start = Math.max(0, match.index - 30);
  const end = Math.min(text.length, match.index + match[0].length + 30);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function guessCompanyName(text) {
  const patterns = [
    /(?:company|from|by|at|for)\s*[:\-]?\s*([A-Z][A-Za-z0-9&.\- ]{2,50})/,
    /([A-Z][A-Z0-9&.\- ]{3,60})(?:\s+PVT|\s+PRIVATE|\s+LTD|\s+LIMITED|\s+CO\.?|\s+COMPANY)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s+/g, ' ').slice(0, 80);
  }
  return '';
}

function fallbackAnalyze(text) {
  const redFlags = [];
  let score = 0;

  for (const rule of FLAG_RULES) {
    if (rule.re.test(text)) {
      score += rule.score;
      redFlags.push({
        type: rule.type,
        title: rule.title,
        description: rule.description,
        severity: rule.severity,
        evidence: evidenceFor(text, rule.re)
      });
    }
  }

  if (text.length < 120) score += 8;
  score = Math.min(100, Math.max(5, score));
  const risk_level = score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk';

  return {
    risk_score: score,
    risk_level,
    language_detected: detectLanguage(text),
    company_name: guessCompanyName(text),
    summary: redFlags.length
      ? `This offer shows ${redFlags.length} scam indicator${redFlags.length === 1 ? '' : 's'}, including ${redFlags.slice(0, 2).map((f) => f.title.toLowerCase()).join(' and ')}. Verify the employer independently before sharing documents or money.`
      : 'No strong scam indicators were found in the pasted text. Still verify the employer, domain, recruiter identity, and offer letter before taking action.',
    red_flags: redFlags,
    recommendations: [
      'Do not pay any registration, training, equipment, or security fee.',
      'Verify the company on its official website and contact HR through official channels.',
      'Do not share Aadhaar, PAN, bank details, or photos until the employer is verified.',
      'Report suspected fraud at cybercrime.gov.in or call 1930 if money was lost.'
    ]
  };
}

async function invokeJobShieldAI(payload) {
  const { data, error } = await supabase.functions.invoke('jobshield-ai', { body: payload });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function uploadAndExtractText(file, onProgress) {
  onProgress?.('upload', 'Uploading file to secure storage...');
  const [{ file_url }, base64] = await Promise.all([
    api.storage.uploadFile(file),
    fileToBase64(file)
  ]);

  onProgress?.('extract', 'Extracting readable text with AI...');
  const result = await invokeJobShieldAI({
    action: 'extract',
    base64,
    mimeType: file.type || 'application/octet-stream'
  });

  const text = result.extracted_text || result.text || '';
  if (text.trim().length < 5) {
    throw new Error('Could not read any usable text from this file. Please upload a clearer screenshot or paste the offer text manually.');
  }

  return {
    file_url,
    text,
    language: result.language_detected || 'English'
  };
}

export async function analyzeOfferText(text) {
  try {
    return await invokeJobShieldAI({ action: 'analyze', text });
  } catch (error) {
    console.warn('Gemini analysis unavailable, using local fallback:', error);
    return fallbackAnalyze(text);
  }
}

export async function verifyCompany(companyName) {
  if (!companyName || companyName.trim().length < 2) return null;
  try {
    return await invokeJobShieldAI({ action: 'verify_company', companyName });
  } catch {
    return {
      company_name: companyName,
      mca_status: 'Uncertain',
      gst_status: 'Uncertain',
      domain_check: 'Not Found',
      blacklist_check: 'Uncertain',
      is_verified: false,
      notes: 'Live company verification could not be completed. Check MCA, GST, official domain, and independent reviews manually.'
    };
  }
}



