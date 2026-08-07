const RULES = [
  { label: "Upfront fee", score: 35, re: /(registration|training|security|processing|refundable|equipment|joining|activation).{0,35}(fee|charge|deposit|payment|amount)|pay\s*(rs\.?|inr|\u20b9)?\s*\d+/i },
  { label: "WhatsApp/Telegram pressure", score: 18, re: /whatsapp|telegram|t\.me|message me|personal number|dm me/i },
  { label: "Free email recruiter", score: 16, re: /[a-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/i },
  { label: "No interview / direct joining", score: 22, re: /without interview|no interview|direct joining|selected without|guaranteed job/i },
  { label: "Unrealistic earning", score: 18, re: /(earn|salary|income).{0,35}(daily|per day|2 hours|part time|work from home).{0,35}(rs\.?|inr|\u20b9)?\s*\d{3,}/i },
  { label: "Sensitive documents", score: 20, re: /aadhaar|aadhar|pan card|bank details|account number|ifsc|passport photo/i },
  { label: "Urgency pressure", score: 12, re: /urgent|today only|last chance|immediately|limited seats|reply fast/i },
  { label: "Bond or penalty", score: 18, re: /(bond|agreement|contract).{0,45}(penalty|fine|pay|recover|year|month)/i },
  { label: "Suspicious payment handle", score: 22, re: /\b[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}\b.*(pay|send|deposit|fee|amount)|upi|gpay|phonepe|paytm/i }
];

const ROOT_ID = "jobshield-copilot-root";
const HIGHLIGHT_CLASS = "jobshield-risk-highlight";
const STORAGE_KEY = "jobshieldCollapsed";
let latest = null;
let aiTimer = null;
let aiRequestId = 0;

const EXCLUDED_HOSTS = new Set(["localhost", "127.0.0.1"]);
const JOBSHIELD_HOST_RE = /(^|\.)jobshield/i;

function isExcludedPage() {
  const host = location.hostname.toLowerCase();
  return EXCLUDED_HOSTS.has(host) || JOBSHIELD_HOST_RE.test(host);
}

function send(type, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...payload }, resolve);
  });
}

function scoreText(text) {
  const hits = RULES.filter((rule) => rule.re.test(text));
  const score = Math.min(100, hits.reduce((sum, hit) => sum + hit.score, 0));
  const level = score >= 70 ? "High Risk" : score >= 40 ? "Medium Risk" : score > 0 ? "Watch" : "Clear";
  return { score, level, hits, source: "Local scan" };
}

function selectedText() {
  return String(window.getSelection?.() || "").trim();
}

function pageText() {
  const selected = selectedText();
  if (selected.length > 40) return selected.slice(0, 12000);

  const selectors = [
    "[role='main']",
    ".msg-s-message-list",
    "[aria-label*='Message']",
    "[data-testid*='conversation']",
    "[contenteditable='true']",
    "main",
    "article",
    "body"
  ];

  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = node?.innerText?.trim();
    if (text && text.length > 80) return text.slice(0, 12000);
  }
  return document.body.innerText.slice(0, 12000);
}

function clearHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((node) => {
    node.classList.remove(HIGHLIGHT_CLASS);
    node.removeAttribute("data-jobshield-risk");
  });
}

function highlightRiskyElements(hits) {
  clearHighlights();
  if (!hits.length) return;
  const candidates = [...document.querySelectorAll("p, span, div, article, li, td")]
    .filter((node) => node.id !== ROOT_ID && !node.closest(`#${ROOT_ID}`))
    .filter((node) => node.children.length <= 4 && node.innerText && node.innerText.length > 8 && node.innerText.length < 700)
    .slice(0, 700);

  for (const node of candidates) {
    const hit = hits.find((rule) => rule.re.test(node.innerText));
    if (hit) {
      node.classList.add(HIGHLIGHT_CLASS);
      node.setAttribute("data-jobshield-risk", hit.label);
    }
  }
}

function levelClass(level = "") {
  if (level.includes("High")) return "jobshield-danger";
  if (level.includes("Medium") || level.includes("Watch")) return "jobshield-warn";
  return "jobshield-clear";
}

function mergeAi(local, ai) {
  if (!ai || ai.skipped) return local;
  const aiHits = (ai.red_flags || []).map((flag) => ({
    label: flag.title || flag.type || "AI red flag",
    score: flag.severity === "high" ? 24 : flag.severity === "medium" ? 14 : 8,
    re: new RegExp(escapeRegex(flag.evidence || flag.title || ""), "i")
  }));
  return {
    ...local,
    score: Math.max(local.score, Math.round(ai.risk_score || 0)),
    level: ai.risk_level || local.level,
    hits: [...local.hits, ...aiHits].slice(0, 8),
    source: "AI + local scan",
    summary: ai.summary || "",
    company: ai.company_name || ""
  };
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function appUrl(path = "/analyzer") {
  return send("JOBSHIELD_GET_SETTINGS").then((response) => {
    const base = response?.settings?.appUrl || "https://job-shield-ai-beta.vercel.app";
    return `${base.replace(/\/$/, "")}${path}`;
  });
}

function removeWidget() {
  document.getElementById(ROOT_ID)?.remove();
  clearHighlights();
}

function render(result, state = {}) {
  if (isExcludedPage()) {
    removeWidget();
    return;
  }
  latest = result;
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.documentElement.appendChild(root);
  }

  const collapsed = localStorage.getItem(STORAGE_KEY) === "1";
  const level = result.level || "Clear";
  const score = Math.min(100, Math.max(0, Math.round(result.score || 0)));
  const hits = result.hits || [];

  root.innerHTML = collapsed ? `
    <button class="jobshield-pill ${levelClass(level)}" title="Open JobShield Copilot">
      JS · ${score}
    </button>
  ` : `
    <div class="jobshield-widget ${levelClass(level)}">
      <div class="jobshield-top">
        <div class="jobshield-logo">JS</div>
        <div class="jobshield-heading">
          <div class="jobshield-title">JobShield Copilot</div>
          <div class="jobshield-subtitle">${level} · ${score}/100 · ${result.source || "Local scan"}</div>
        </div>
        <button class="jobshield-icon-btn jobshield-collapse" title="Collapse">-</button>
      </div>
      <div class="jobshield-bar"><span style="width:${score}%"></span></div>
      ${state.aiLoading ? `<div class="jobshield-ai">AI scan running...</div>` : ""}
      ${state.aiError ? `<div class="jobshield-ai jobshield-ai-error">AI unavailable · local scan active</div>` : ""}
      ${result.summary ? `<p class="jobshield-summary">${escapeHtml(result.summary)}</p>` : ""}
      ${result.company ? `<div class="jobshield-company">Company: ${escapeHtml(result.company)}</div>` : ""}
      <div class="jobshield-hits">
        ${hits.length ? hits.slice(0, 5).map((hit) => `<span>${escapeHtml(hit.label)}</span>`).join("") : "<span>No strong job-scam signal found</span>"}
      </div>
      <div class="jobshield-actions">
        <button class="jobshield-open">Full scan</button>
        <button class="jobshield-selected">Scan selected</button>
        <button class="jobshield-rescan">Rescan</button>
      </div>
    </div>
  `;

  root.querySelector(".jobshield-pill")?.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, "0");
    render(latest || result);
  });
  root.querySelector(".jobshield-collapse")?.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, "1");
    render(latest || result);
  });
  root.querySelector(".jobshield-rescan")?.addEventListener("click", () => scan(true));
  root.querySelector(".jobshield-selected")?.addEventListener("click", () => scan(true, selectedText()));
  root.querySelector(".jobshield-open")?.addEventListener("click", async () => {
    const text = encodeURIComponent(pageText().slice(0, 7000));
    window.open(`${await appUrl("/analyzer")}?text=${text}`, "_blank");
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

async function runAiScan(local, text, requestId) {
  render(local, { aiLoading: true });
  const response = await send("JOBSHIELD_AI_ANALYZE", { text });
  if (requestId !== aiRequestId) return;
  if (!response?.ok) {
    render(local, { aiError: true });
    return;
  }
  const merged = mergeAi(local, response.result);
  highlightRiskyElements(merged.hits);
  render(merged);
}

function scan(forceAi = false, overrideText = "") {
  if (isExcludedPage()) {
    removeWidget();
    return;
  }
  const text = (overrideText || pageText()).trim();
  if (!text) return;
  const local = scoreText(text);
  const selected = Boolean(overrideText || selectedText().length > 40);
  if (!forceAi && !selected && local.score === 0) {
    removeWidget();
    return;
  }
  highlightRiskyElements(local.hits);
  render(local);

  clearTimeout(aiTimer);
  const shouldAi = forceAi || local.score >= 20 || text.length > 250;
  if (shouldAi) {
    const requestId = ++aiRequestId;
    aiTimer = setTimeout(() => runAiScan(local, text, requestId), forceAi ? 0 : 900);
  }
}

let timer = null;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(() => scan(false), 900);
};

scan(false);
document.addEventListener("selectionchange", () => {
  if (selectedText().length > 40) schedule();
});
new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
