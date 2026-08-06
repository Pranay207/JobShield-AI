import { supabase } from "@/api/supabaseClient";

const CLAUSE_RULES = [
  {
    type: "upfront_fee",
    label: "Upfront payment",
    severity: "critical",
    re: /(registration|training|security|processing|refundable|equipment|joining|activation).{0,40}(fee|charge|deposit|payment|amount)|pay\s*(rs\.?|inr|₹)?\s*\d+/i,
    explanation: "The offer appears to require money before verified employment."
  },
  {
    type: "bond_penalty",
    label: "Bond or penalty clause",
    severity: "high",
    re: /(bond|agreement|contract).{0,50}(year|month|penalty|fine|pay|amount|recover)|penalty.{0,30}(leave|resign|quit)/i,
    explanation: "The offer may financially punish the candidate for leaving."
  },
  {
    type: "unpaid_training",
    label: "Unpaid or paid training trap",
    severity: "high",
    re: /(training|probation).{0,50}(unpaid|without salary|fee|deposit|deduct|charge)/i,
    explanation: "Training/probation language can hide unpaid work or fee collection."
  },
  {
    type: "salary_deduction",
    label: "Salary deduction",
    severity: "medium",
    re: /(deduct|deduction|recover|cut).{0,40}(salary|stipend|payment|first month)/i,
    explanation: "The offer mentions deductions that should be explained before acceptance."
  },
  {
    type: "document_control",
    label: "Document control risk",
    severity: "high",
    re: /(submit|deposit|hold|retain).{0,40}(original|certificate|marksheet|passport|aadhaar|aadhar|pan)/i,
    explanation: "Requests to hold original documents are a serious candidate-safety risk."
  },
  {
    type: "wire_transfer",
    label: "Wire/UPI transfer instruction",
    severity: "critical",
    re: /(upi|gpay|phonepe|paytm|bank transfer|account number|ifsc).{0,60}(pay|send|deposit|transfer|fee|amount)/i,
    explanation: "Payment instructions inside an offer letter strongly increase scam risk."
  }
];

function evidenceFor(text, re) {
  const match = text.match(re);
  if (!match) return "";
  const start = Math.max(0, match.index - 45);
  const end = Math.min(text.length, match.index + match[0].length + 65);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function amountAtRisk(text) {
  const amounts = [...String(text || "").matchAll(/(?:rs\.?|inr|₹)\s*([0-9][0-9,]*)/gi)]
    .map((match) => Number(String(match[1]).replace(/,/g, "")))
    .filter(Number.isFinite);
  return amounts.length ? Math.max(...amounts) : 0;
}

export function fallbackOfferDna(text) {
  const clauses = CLAUSE_RULES
    .filter((rule) => rule.re.test(text))
    .map((rule) => ({
      type: rule.type,
      label: rule.label,
      severity: rule.severity,
      evidence: evidenceFor(text, rule.re),
      explanation: rule.explanation
    }));

  const score = Math.min(100, clauses.reduce((sum, clause) => {
    if (clause.severity === "critical") return sum + 32;
    if (clause.severity === "high") return sum + 22;
    return sum + 12;
  }, text.length < 180 ? 8 : 0));

  return {
    score,
    level: score >= 70 ? "High Contract Risk" : score >= 35 ? "Medium Contract Risk" : "Low Contract Risk",
    estimated_money_at_risk: amountAtRisk(text),
    clauses,
    hidden_traps: clauses.map((clause) => clause.label),
    recommendation: clauses.length
      ? "Do not sign or pay until every flagged clause is verified through official company channels."
      : "No major contract trap was detected, but still verify the employer and offer terms independently."
  };
}

async function invokeOfferDna(text) {
  const { data, error } = await supabase.functions.invoke("jobshield-ai", {
    body: { action: "offer_dna", text }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function analyzeOfferDna(text) {
  if (!text || text.trim().length < 20) return fallbackOfferDna(text || "");
  try {
    return await invokeOfferDna(text);
  } catch (error) {
    console.warn("OfferDNA AI unavailable, using local parser:", error);
    return fallbackOfferDna(text);
  }
}
