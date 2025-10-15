"use client";

export const dynamic = "force-static"; // always serve a static HTML shell (no bot SSR)

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   Globals / tiny model warmup
   ========================================================= */
let embedder: any = null;

/* =========================================================
   Text utils
   ========================================================= */
const STOP = new Set([
  "the","is","a","an","and","or","to","of","in","for","(3","yrs)","with","by",
  "from","as","this","that","these","those","be","are","it","its","your","you",
  "we","our","they","their","i","me","my","role","requirements","skills",
  "experience","yrs","year","years","responsibilities","manager","hiring"
]);

function tokenize(text: string) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+\-# ]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t) && t.length > 2 && !/^\d+$/.test(t));
}

function keywordFreq(tokens: string[]) {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function topKeywords(text: string, n = 25) {
  const toks = tokenize(text);
  return keywordFreq(toks).slice(0, n).map(([w]) => w);
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/* =========================================================
   Embeddings (browser)
   ========================================================= */
async function getEmbedder() {
  if (embedder) return embedder;
  let mod: any;
  try { mod = await import("@xenova/transformers"); }
  catch (e) { console.error("Failed to import @xenova/transformers", e); throw e; }
  if (!mod) throw new Error("Transformers undefined after import");
  const pipeline = mod.pipeline, env = mod.env;
  if (!pipeline || !env) throw new Error("Transformers missing pipeline/env");
  env.cacheDir = "indexeddb://models";
  env.useBrowserCache = true;
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  return embedder;
}

async function embed(text: string): Promise<number[]> {
  const p = await getEmbedder();
  const out = await p(text, { pooling: "mean", normalize: true });
  return Array.from(out.data as Float32Array);
}

/* =========================================================
   Buckets, summary, plan
   ========================================================= */
const BUCKETS: Record<string, string> = {
  // channels / platforms
  "google": "Channels", "ads": "Channels", "facebook": "Channels", "meta": "Channels",
  "campaign": "Channels", "leads": "Channels",
  // skills / methods
  "seo": "Skills", "content": "Skills", "copy": "Skills", "email": "Skills",
  "landing": "Skills", "optimization": "Skills", "testing": "Skills", "ab": "Skills", "a/b": "Skills",
  // analytics / metrics
  "ga4": "Analytics", "analytics": "Analytics", "reporting": "Analytics",
  // tools / tech
  "hubspot": "Tools", "crm": "Tools", "excel": "Tools", "python": "Tools",
};

function bucketOf(word: string) {
  for (const k of Object.keys(BUCKETS)) if (word.includes(k)) return BUCKETS[k];
  return "Other";
}

function prioritize(missing: string[]) {
  return [...missing]
    .filter(w => w.length >= 3)
    .sort((a,b) => {
      const ba = bucketOf(a) === "Other" ? 1 : 0;
      const bb = bucketOf(b) === "Other" ? 1 : 0;
      if (ba !== bb) return ba - bb;
      return b.length - a.length;
    });
}

function joinList(arr: string[]) {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];
}

function makeBullets(jdKw: string[], resumeText: string, limit = 5) {
  const lines = (resumeText || "").split(/\n+/).filter(Boolean);
  const suggestions: string[] = [];
  const verbs = ["Delivered","Increased","Reduced","Built","Led","Launched","Optimized","Automated","Migrated","Improved"];
  let vi = 0;
  for (const kw of jdKw) {
    if (suggestions.length >= limit) break;
    const hit = lines.find((l) => l.toLowerCase().includes(kw.toLowerCase()));
    const v = verbs[vi++ % verbs.length];
    if (hit) suggestions.push(`${v} ${kw} outcomes — ${hit.replace(/^[•\-\s]+/, "")} (add metric: +X% CTR / -Y% CPA / +Z leads).`);
    else suggestions.push(`${v} ${kw} initiatives using A/B tests and GA4; achieved +X% CTR and -Y% CPA across N campaigns in Qx.`);
  }
  return suggestions;
}

function makeSummary(prioritized: string[]) {
  const take = prioritized.slice(0, 8);
  const channels = take.filter(w => bucketOf(w) === "Channels");
  const skills   = take.filter(w => bucketOf(w) === "Skills");
  const analytics= take.filter(w => bucketOf(w) === "Analytics");
  const tools    = take.filter(w => bucketOf(w) === "Tools");
  const parts: string[] = [];
  if (channels.length) parts.push(`${joinList(channels)} campaigns`);
  if (skills.length)   parts.push(joinList(skills));
  if (analytics.length)parts.push(joinList(analytics));
  if (tools.length)    parts.push(`tools incl. ${joinList(tools)}`);
  const core = parts.filter(Boolean).join(" • ");
  return `Digital marketing professional delivering growth via ${core}. Proven impact with A/B testing, landing page optimization and full-funnel reporting.`;
}

function planToTarget(currentScore: number, target: number, missing: string[]) {
  const prioritized = prioritize(missing);
  const gap = Math.max(0, target - (currentScore || 0));
  const needed = Math.min(prioritized.length, Math.max(0, Math.ceil(gap / 3)));
  const mustAdd = prioritized.slice(0, needed);
  const alsoAdd = prioritized.slice(needed, needed + 6);
  const actions = [
    `Add ${mustAdd.length} high-priority keywords to SUMMARY: ${joinList(mustAdd)}.`,
    `Create ${Math.min(3, Math.max(1, mustAdd.length))} STAR bullets highlighting 1–2 of: ${joinList(mustAdd)} with concrete metrics.`,
    alsoAdd.length ? `Sprinkle also: ${joinList(alsoAdd)}.` : "",
    `Ensure each added keyword appears naturally (summary + 1 bullet).`,
  ].filter(Boolean);
  return { prioritized, gap, needed, mustAdd, alsoAdd, actions };
}

/* =========================================================
   ATS bullet grader
   ========================================================= */
const ACTION_VERBS = [
  "delivered","increased","reduced","built","led","launched","optimized","automated","migrated","improved",
  "grew","drove","achieved","saved","designed","developed","implemented","owned","created","deployed","scaled"
];

function extractBullets(text: string): string[] {
  const raw = text.split(/\n|•|-\s+/).concat(text.split(/[.?!]\s+/));
  const items = Array.from(new Set(raw.map(s => s.trim()).filter(Boolean)));
  return items.filter(s => {
    const wc = s.split(/\s+/).length;
    return wc >= 7 && wc <= 35;
  }).slice(0, 20);
}

function gradeBullet(bullet: string, jdTop: string[]): { score: number; tips: string[] } {
  const t = bullet.toLowerCase();
  let score = 0;
  const tips: string[] = [];

  const first = t.split(/\s+/)[0] || "";
  if (ACTION_VERBS.includes(first.replace(/[^a-z]/g,""))) score += 25;
  else tips.push("Start with a strong action verb (e.g., Led, Optimized, Launched).");

  if (/\b(\d+%?|\+\d+%|-\d+%|[0-9]+x|roi|ctr|cpa|conversion|leads)\b/i.test(bullet)) score += 25;
  else tips.push("Add a number/metric (e.g., +32% CTR, -18% CPA, +1.3x leads).");

  const toks = new Set(tokenize(t));
  const hit = jdTop.some(k => toks.has(k));
  if (hit) score += 25; else tips.push("Reference at least one JD keyword directly.");

  const wc = bullet.trim().split(/\s+/).length;
  if (wc >= 12 && wc <= 24) score += 15; else tips.push("Aim for ~12–24 words (concise and scannable).");

  if (/(result|impact|increase|decrease|grew|reduced|optimized|achieved|drove|delivered|improved|saved|roi|ctr|cpa|revenue|leads|conversion)/i.test(bullet))
    score += 10;
  else tips.push("End with outcome/impact (what changed).");

  return { score, tips };
}

/* =========================================================
   Heuristic rewrites
   ========================================================= */
function capitalise(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function pickVerb(text?: string) {
  const first = (text||"").trim().split(/\s+/)[0]?.toLowerCase() || "";
  if (ACTION_VERBS.includes(first)) return capitalise(first);
  const list = ["delivered","led","optimized","built","launched","improved","increased","reduced","implemented","scaled"];
  return capitalise(list[Math.floor(Math.random()*list.length)]);
}

function capWords(s: string, max = 26) {
  const words = s.split(/\s+/);
  if (words.length <= max) return s;
  return words.slice(0, max).join(" ") + "…";
}

function rewriteBullet(bullet: string, prioritized: string[]): string {
  const verb = pickVerb(bullet);
  const kws = prioritized.slice(0, 4);
  const insert = joinList(kws.slice(0, 2));
  const metric = "+X% CTR / -Y% CPA / +Z leads";
  const core = bullet
    .replace(/^[•\-\s]+/,"")
    .replace(/^[A-Za-z]+:\s*/,"")
    .replace(/^[A-Za-z]+(\s+)/,"");
  const sentence = `${verb} ${insert ? insert + " initiatives — " : ""}${core.replace(/\.$/,"")}; achieved ${metric}.`;
  return capWords(sentence, 26);
}

type RewritePair = { old: string; neu: string };

/* =========================================================
   Cover letter & concise summary
   ========================================================= */
function guessCompany(jd: string) {
  const m1 = jd.match(/\bat\s+([A-Z][A-Za-z0-9&.\-]+)\b/);
  const m2 = jd.match(/\bwe(?:’|')?re\s+([A-Z][A-Za-z0-9&.\-]+)\b/i);
  return m1?.[1] || m2?.[1] || null;
}
function guessRole(jd: string) {
  const m = jd.match(/hiring\s+a?n?\s*([A-Za-z ]{3,60})/i);
  return m?.[1]?.trim();
}

function makeCoverLetter(jd: string, resume: string, prioritized: string[], companyGuess?: string) {
  const company = companyGuess || guessCompany(jd) || "Hiring Manager";
  const role = guessRole(jd) || "the role";
  const focus = prioritized.slice(0, 8);
  const channels = focus.filter(w => bucketOf(w) === "Channels");
  const skills   = focus.filter(w => bucketOf(w) === "Skills");
  const analytics= focus.filter(w => bucketOf(w) === "Analytics");
  const tools    = focus.filter(w => bucketOf(w) === "Tools");

  const p1 = `Dear ${company},\n\nI’m excited to apply for ${role}. My background combines hands-on campaign execution with data-driven growth, and maps closely to your requirements.`;
  const p2 = `In prior roles, I ran ${joinList(channels)} while managing ${joinList(skills)} across the funnel. I rely on ${joinList(analytics)} to guide decisions and am comfortable with ${tools.length ? joinList(tools) : "modern growth tooling"}.`;
  const p3 = `Highlights include driving measurable lift through A/B tests, landing page optimization and funnel reporting — consistently improving CTR/CPA and lead quality. I collaborate closely with design, content and sales to translate insights into action.`;
  const p4 = `I’d love to bring this playbook to ${company} and contribute from day one. Thank you for your time — I’m happy to share work samples or a quick walkthrough of my approach.\n\nBest regards,\nYour Name`;
  return [p1, p2, p3, p4].join("\n\n");
}

/* JD-specific concise summary (≤75 words) */
function limitWords(s: string, max = 75) {
  const w = s.split(/\s+/).filter(Boolean);
  if (w.length <= max) return s;
  return w.slice(0, max).join(" ") + ".";
}
function makeConciseSummary(jd: string, prioritized: string[], target: number) {
  const ch  = prioritized.filter(w => bucketOf(w) === "Channels").slice(0,3);
  const sk  = prioritized.filter(w => bucketOf(w) === "Skills").slice(0,3);
  const an  = prioritized.filter(w => bucketOf(w) === "Analytics").slice(0,2);
  const tl  = prioritized.filter(w => bucketOf(w) === "Tools").slice(0,2);

  const s1 = `Performance-driven marketer aligned to this JD: ${ch.length?joinList(ch)+" campaigns": "multi-channel campaigns"} with ${sk.length?joinList(sk):"CRO, testing"};`;
  const s2 = ` fluent in ${an.length?joinList(an):"analytics"} and ${tl.length?joinList(tl):"modern tools"}.`;
  const s3 = ` Drove measurable lift via A/B testing and landing page optimization, improving CTR/CPA and lead quality.`;
  const s4 = ` Ready to contribute immediately and exceed the hiring bar (target score ${target}+).`;
  return limitWords((s1 + s2 + s3 + s4).replace(/\s+/g," ").trim(), 75);
}

/* =========================================================
   ATS format lint
   ========================================================= */
type LintItem = { level: "error" | "warn" | "info"; message: string; hint?: string };

function runATSLintNow(text: string): LintItem[] {
  const items: LintItem[] = [];
  const t = text || "";

  const words = t.trim().split(/\s+/).filter(Boolean).length;
  if (words < 180) items.push({ level: "warn", message: "Resume looks very short.", hint: "Aim ~300–700 words (1–2 pages)." });
  if (words > 1100) items.push({ level: "warn", message: "Resume may be too long.", hint: "Trim to <900 words; keep bullets crisp." });

  if (/[^\x00-\x7F]/.test(t)) items.push({ level: "warn", message: "Non-ASCII characters / emoji present.", hint: "Replace fancy symbols with standard ASCII." });

  if (/[│┼┤┐┘┴┬═╬║]/.test(t) || /\|.*\|/.test(t)) items.push({ level: "warn", message: "Table/column characters detected.", hint: "Avoid multi-column tables; use simple sections." });

  if (/!\[.*?\]\(.*?\)|<img[\s\S]*?>|https?:\/\/\S+\.(png|jpg|jpeg|gif|svg)/i.test(t))
    items.push({ level: "warn", message: "Images detected.", hint: "Remove logos/headshots; ATS ignores them." });

  ["experience","education","skills"].forEach(h => {
    if (!new RegExp(`\\b${h}\\b`, "i").test(t))
      items.push({ level: "info", message: `No '${h}' heading found.`, hint: `Add a clear '${capitalise(h)}' section.` });
  });

  const overlongLine = t.split(/\n/).some(line => line.trim().split(/\s+/).length > 35);
  if (overlongLine) items.push({ level: "info", message: "Some bullets exceed ~35 words.", hint: "Keep bullets ~12–24 words." });

  const m1 = t.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/ig) || [];
  const m2 = t.match(/\b\d{2}\/\d{4}\b/g) || [];
  if (m1.length > 0 && m2.length > 0) items.push({ level: "info", message: "Mixed date formats detected.", hint: "Use one style consistently (e.g., Jan 2023 – Mar 2024)." });

  if (/\t/.test(t)) items.push({ level: "info", message: "Tab characters found.", hint: "Use spaces; avoid tabs for alignment." });

  if (/[●◦▪◆➤►]/.test(t)) items.push({ level: "info", message: "Fancy bullet symbols present.", hint: "Prefer '-' or '•' consistently." });

  const emails = (t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig) || []).length;
  const phones = (t.match(/\+?[0-9][0-9\s\-()]{7,}/g) || []).length;
  if (emails === 0 || phones === 0) items.push({ level: "warn", message: "Missing contact info (email/phone).", hint: "Ensure top section has both." });

  return items;
}

/* =========================================================
   LinkedIn pack helpers
   ========================================================= */
function limitChars(s: string, max = 220) {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function makeLinkedInHeadlines(prioritized: string[], roleGuess?: string): string[] {
  const ch = prioritized.filter(w => bucketOf(w) === "Channels").slice(0,4);
  const sk = prioritized.filter(w => bucketOf(w) === "Skills").slice(0,3);
  const an = prioritized.filter(w => bucketOf(w) === "Analytics").slice(0,2);
  const tl = prioritized.filter(w => bucketOf(w) === "Tools").slice(0,2);
  const role = roleGuess ? capitalise(roleGuess) : "Digital Marketing";

  const v1 = `${role} | ${[...ch, ...sk].slice(0,5).map(capitalise).join(" | ")} | ${[...an, ...tl].slice(0,2).map(capitalise).join(" & ")}`;
  const v2 = `Performance Marketer | A/B Testing, CRO, ${an.slice(0,1).map(capitalise).join("") || "Analytics"} | ${ch.slice(0,2).map(capitalise).join(" & ")} | Leads & Growth`;
  const v3 = `Grew CTR +X% | Cut CPA -Y% | ${ch.slice(0,2).map(capitalise).join(" & ")} | ${sk.slice(0,2).map(capitalise).join(" & ")}`;

  return [limitChars(v1, 220), limitChars(v2, 220), limitChars(v3, 220)];
}

function makeLinkedInAbout(summary: string, bullets: string[], prioritized: string[]): string {
  const intro = summary || "Data-driven marketer focused on growth, experimentation and clear outcomes.";
  const hi = bullets.slice(0, 5).map(b => "• " + b.replace(/\s+/g," ").trim()).join("\n");
  const keys = prioritized.slice(0, 18).map(capitalise).join(", ");
  const raw = `${intro}\n\nHighlights:\n${hi}\n\nKeywords: ${keys}\n`;
  return limitChars(raw, 2500); // keep <2600
}

function makeLinkedInFeatured(bullets: string[]) {
  return bullets.slice(0, 3).map(b => capWords(b.replace(/;.*$/, ""), 24));
}

/* =========================================================
   Paywall (Razorpay)
   ========================================================= */
declare global { interface Window { Razorpay?: any } }

/* =========================================================
   Tabs (left nav)
   ========================================================= */
type TabKey =
  | "tailor"
  | "star"
  | "cover"
  | "fix"
  | "learn"
  | "referrals"
  | "interview"
  | "share";

const NAV_ITEMS: Array<{ key: TabKey; label: string }> = [
  { key: "tailor",     label: "Tailor & Export" },
  { key: "star",       label: "STAR Story Builder" },
  { key: "cover",      label: "Cover-Letter Variants" },
  { key: "fix",        label: "Fix My Resume" },
  { key: "learn",      label: "What to Learn Next" },
  { key: "referrals",  label: "Referral / Cold DM" },
  { key: "interview",  label: "Interview Q-Pack" },
  { key: "share",      label: "Shareable Scorecard" },
];

/* =========================================================
   Component
   ========================================================= */
export default function Page() {
  // Prefill so users can click Analyze immediately
  const [jd, setJd] = useState(
    "We’re hiring a Digital Marketing Manager (3+ yrs). Responsibilities: Google Ads, Facebook Ads, SEO, content marketing, GA4 analytics, landing page optimization, A/B testing, CRM (HubSpot), email campaigns, leads reporting. Nice to have: Python basics for data, Excel."
  );
  const [resume, setResume] = useState(
    "Digital marketer with 4+ years. Ran Google Ads & Meta Ads, set up GA4, built landing pages, did CRO and A/B tests. Wrote SEO content and automated emails in HubSpot. Comfortable with Excel; basic Python."
  );

  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [bullets, setBullets] = useState<string[]>([]);
  const [modelReady, setModelReady] = useState(false);
  const [target, setTarget] = useState(90);
  const [predicted, setPredicted] = useState<number | null>(null);
  const [bucketStats, setBucketStats] = useState<{name:string; covered:number; total:number}[]>([]);
  const [jdTopState, setJdTopState] = useState<string[]>([]);
  const [ejdVec, setEjdVec] = useState<number[] | null>(null);

  // ATS grader + cover letter + rewrites + concise summary
  const [bulletInput, setBulletInput] = useState<string>("");
  const [bulletGrades, setBulletGrades] = useState<{bullet:string; score:number; tips:string[]}[]>([]);
  const [rewrites, setRewrites] = useState<RewritePair[]>([]);
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [conciseSummary, setConciseSummary] = useState<string>("");

  // improved summary (mutable so we can inject keywords)
  const [improvedSummaryText, setImprovedSummaryText] = useState<string>("");

  // cookie → unlock
  const [unlocked, setUnlocked] = useState<boolean>(false);
  useEffect(() => {
    if (typeof document !== "undefined") setUnlocked(document.cookie.includes("unlocked=1"));
  }, []);

  // pre-warm model
  useEffect(() => {
    const h = setTimeout(() => { if (!modelReady) getEmbedder().then(() => setModelReady(true)).catch(()=>{}); }, 600);
    return () => clearTimeout(h);
  }, [jd, resume, modelReady]);

  // compute breakdown bars
  const computeBucketStats = (jdTop: string[], cvTop: Set<string>) => {
    const groups = ["Channels","Skills","Analytics","Tools"];
    const stats = groups.map((g) => {
      const req = jdTop.filter(w => bucketOf(w) === g);
      const cov = req.filter(w => cvTop.has(w));
      return { name: g, covered: cov.length, total: req.length };
    });
    setBucketStats(stats);
  };

  /* ---------- Analyze ---------- */
  const analyze = async () => {
    setLoading(true); setPredicted(null);
    try {
      const eJd = await embed(jd);
      setEjdVec(eJd);
      const eCv = await embed(resume);
      const s = Math.round(cosine(eJd, eCv) * 100);
      setScore(s);

      const jdTop = topKeywords(jd, 30);
      setJdTopState(jdTop);

      const cvTopArr = topKeywords(resume, 70);
      const cvTop = new Set(cvTopArr);
      const miss = jdTop.filter((k) => !cvTop.has(k));
      setMissing(miss);
      computeBucketStats(jdTop, cvTop);

      const prio = prioritize(miss).slice(0, 8);
      setBullets(makeBullets(prio, resume, unlocked ? 7 : 2));

      const extracted = extractBullets(resume);
      setBulletInput(extracted.join("\n"));
      setBulletGrades([]); setRewrites([]); setCoverLetter(""); setConciseSummary("");

      if (unlocked) {
        setImprovedSummaryText(makeSummary(prio)); // base summary (editable)
      }
    } catch (err) {
      console.error(err);
      alert("Model failed to load/initialize. Try once more.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- ATS grading ---------- */
  const runGrader = () => {
    const lines = bulletInput.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const graded = lines.map(b => {
      const g = gradeBullet(b, jdTopState);
      return { bullet: b, score: g.score, tips: g.tips };
    });
    setBulletGrades(graded);
    setRewrites([]);
  };

  /* ---------- Auto-rewrite lows ---------- */
  const plan = useMemo(() => planToTarget(score ?? 0, target, missing), [score, target, missing]);

  const rewriteLowBullets = () => {
    const lows = (bulletGrades.length ? bulletGrades : bulletInput.split(/\n+/).map(b => ({bullet:b.trim(), score:0, tips:[]})))
      .filter(g => g.bullet)
      .sort((a,b)=>a.score-b.score)
      .filter(g => g.score < 70)
      .slice(0, 8);
    const baseList = lows.length ? lows : bulletGrades.slice(0, 4);
    const list: RewritePair[] = baseList.map(g => ({
      old: g.bullet,
      neu: rewriteBullet(g.bullet, plan.prioritized),
    }));
    setRewrites(list);
  };

  /* ---------- Cover letter / concise ---------- */
  const generateCover = () => setCoverLetter(makeCoverLetter(jd, resume, plan.prioritized));
  const generateConcise = () => setConciseSummary(makeConciseSummary(jd, plan.prioritized, target));

  /* ---------- Razorpay unlock ---------- */
  async function loadScript(src: string) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src; s.onload = resolve as any; s.onerror = reject as any; document.body.appendChild(s);
    });
  }
  const unlock = async () => {
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    const res = await fetch("/api/order", { method: "POST" });
    const order = await res.json();
    const options: any = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount, currency: "INR",
      name: "JD Matcher Pro Unlock", description: "Unlock full results & export", order_id: order.id,
      handler: async (response: any) => {
        const verifyRes = await fetch("/api/verify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        if (verifyRes.ok) { document.cookie = "unlocked=1; Max-Age=31536000; Path=/"; setUnlocked(true); }
        else alert("Verification failed. If money deducted, contact support.");
      },
      theme: { color: "#0ea5e9" }, prefill: { name: "Your Name", email: "you@example.com" },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  /* =========================================================
     Checklist (L-2.1–2.3)
     ========================================================= */
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [appliedKeywords, setAppliedKeywords] = useState<string[]>([]);

  function groupByBucket(list: string[]) {
    const g: Record<string, string[]> = { Channels: [], Skills: [], Analytics: [], Tools: [], Other: [] };
    for (const w of list) {
      const b = bucketOf(w);
      if (g[b]) g[b].push(w);
      else g.Other.push(w);
    }
    return g;
  }

  const groupedChecklist = useMemo(() => groupByBucket(plan.prioritized), [plan.prioritized]);
  function toggleChecklist(kw: string) {
    setSelectedKeywords((prev) => prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]);
  }
  function uniq(arr: string[]) { return Array.from(new Set(arr)); }
  function ensureContains(base: string, kw: string) {
    const rx = new RegExp(`\\b${kw}\\b`, "i");
    return rx.test(base);
  }
  function addToSummaryText(base: string, kws: string[]) {
    const add = kws.filter(k => !ensureContains(base, k));
    if (!add.length) return base;
    const addon = " • " + joinList(add.slice(0, 8));
    return (base || "").replace(/\s+$/, "") + addon;
  }
  async function recomputePredictedAndCoverage(extraList: string[]) {
    try {
      const eJd = ejdVec || await embed(jd);
      const eCv2 = await embed(resume + " " + extraList.join(" "));
      setPredicted(Math.round(cosine(eJd, eCv2) * 100));
      const cvTopAug = new Set<string>([...topKeywords(resume, 70), ...extraList.map(x => x.toLowerCase())]);
      computeBucketStats(jdTopState, cvTopAug);
    } catch (e) { console.error(e); }
  }
  function selectedByBucket(bucket?: string) {
    return selectedKeywords.filter(k => !bucket || bucketOf(k) === bucket);
  }
  const applyToSummary = async (bucket?: string) => {
    const list = uniq(selectedByBucket(bucket).filter(k => !appliedKeywords.includes(k)));
    if (!list.length) return;
    setImprovedSummaryText(prev => addToSummaryText(prev, list));
    const applied = uniq([...appliedKeywords, ...list]);
    setAppliedKeywords(applied);
    const adds = makeBullets(list, resume, Math.min(4, list.length));
    setBullets(prev => uniq([...prev, ...adds]));
    setSelectedKeywords(prev => prev.filter(k => !list.includes(k)));
    await recomputePredictedAndCoverage(applied);
  };
  const applyAsBullets = async (bucket?: string) => {
    const list = uniq(selectedByBucket(bucket).filter(k => !appliedKeywords.includes(k)));
    if (!list.length) return;
    const adds = makeBullets(list, resume, Math.min(6, list.length));
    setBullets(prev => uniq([...prev, ...adds]));
    const applied = uniq([...appliedKeywords, ...list]);
    setAppliedKeywords(applied);
    setSelectedKeywords(prev => prev.filter(k => !list.includes(k)));
    await recomputePredictedAndCoverage(applied);
  };

  /* =========================================================
     Resume upload (PDF/DOCX/TXT)
     ========================================================= */
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadName, setUploadName] = useState<string>("");

  // pdfjs-dist v3 browser build (no node-canvas)
  async function extractTextFromFile(file: File): Promise<string> {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const buf = await file.arrayBuffer();

    if (ext === "pdf") {
      const pdfjsMod: any = await import("pdfjs-dist/legacy/build/pdf");
      const pdfjs: any = pdfjsMod?.default ?? pdfjsMod;
      const ver = "3.11.174"; // keep in sync with package.json
      pdfjs.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${ver}/pdf.worker.min.js`;
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent();
        const pageText = (tc.items as any[]).map((it: any) => it.str || "").join(" ");
        text += pageText + "\n";
      }
      return text.replace(/\s{3,}/g, " ").trim();
    }

    if (ext === "docx") {
      const mammoth: any = await import("mammoth/mammoth.browser");
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      const plain = (tmp.textContent || "").replace(/\u00A0/g, " ");
      return plain.replace(/\s{3,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }

    if (ext === "txt") {
      return new TextDecoder().decode(buf);
    }

    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingResume(true);
    setUploadName(f.name);
    try {
      const text = await extractTextFromFile(f);
      setResume(text);
      setBulletInput(extractBullets(text).join("\n"));
      if (jd && text.trim().length > 0) {
        await analyze(); // auto-analyze
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to read file: " + (err?.message || "Unknown error"));
    } finally {
      setUploadingResume(false);
    }
  }

  /* =========================================================
     Export (TXT/PDF)
     ========================================================= */
  const buildReportLines = () => {
    return [
      `Match Score: ${score}`,
      unlocked && predicted != null ? `Predicted After Fixes: ${predicted}` : "",
      `Target: ${target}`,
      "",
      `Prioritized Keywords:`,
      ...plan.prioritized.map(k => `- ${k}${appliedKeywords.includes(k) ? " (✓ applied)" : ""}`),
      "",
      unlocked ? `Plan to reach ${target}+:` : "",
      ...(unlocked ? plan.actions.map(a => `- ${a}`) : []),
      "",
      unlocked ? `Improved Summary:` : "",
      ...(unlocked ? [improvedSummaryText || "", ""] : []),
      `Suggested Bullets:`,
      ...bullets.map(b => `- ${b}`),
      "",
      unlocked ? "Bucket Coverage:" : "",
      ...(unlocked ? bucketStats.map(b => `- ${b.name}: ${b.covered}/${b.total}`) : []),
      "",
      unlocked ? "ATS Bullet Grades:" : "",
      ...(unlocked ? bulletGrades.map(g => `- [${g.score}] ${g.bullet} | Tips: ${g.tips.join("; ")}`) : []),
      "",
      unlocked && rewrites.length ? "Auto-Rewrites:" : "",
      ...(unlocked ? rewrites.map(r => `- OLD: ${r.old}\n  NEW: ${r.neu}`) : []),
      "",
      unlocked ? "JD-specific 75-word Summary:" : "",
      ...(unlocked && conciseSummary ? [conciseSummary, ""] : []),
      unlocked ? "Cover Letter:" : "",
      ...(unlocked && coverLetter ? [coverLetter] : []),

      unlocked && atsResults.length ? "\nATS Format Lint:" : "",
      ...(unlocked ? atsResults.map(it => `- [${it.level}] ${it.message}${it.hint ? " — " + it.hint : ""}`) : []),
      unlocked && liHeadlines.length ? "\nLinkedIn Headline Options:" : "",
      ...(unlocked ? liHeadlines.map((h,i) => `${i+1}) ${h}`) : []),
      unlocked && liAbout ? "\nLinkedIn About:" : "",
      ...(unlocked && liAbout ? [liAbout] : []),
      unlocked && liBullets.length ? "\nLinkedIn Featured bullets:" : "",
      ...(unlocked ? liBullets.map(b => "• " + b) : []),
    ].filter(Boolean) as string[];
  };

  const exportTxt = () => {
    const lines = buildReportLines();
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "jd-match-plan.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const margin = 40;
    const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lineH = 16;
    const addTitle = (t: string) => {
      ensureSpace(28);
      doc.setFont("helvetica", "bold"); doc.setFontSize(14);
      doc.text(t, margin, y); y += 22;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    };
    const addPara = (t: string | string[]) => {
      const lines = Array.isArray(t) ? t : [t];
      for (const raw of lines) {
        if (!raw) continue;
        const chunks = doc.splitTextToSize(raw, usableWidth);
        for (const c of chunks) {
          ensureSpace(lineH);
          doc.text(c, margin, y);
          y += lineH;
        }
      }
    };
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;
    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("JD Matcher Report", margin, y); y += 26;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    addPara(`Generated: ${new Date().toLocaleString()}`);
    y += 6;

    const lines = buildReportLines();
    const printSection = (title: string, content: string[]) => {
      addTitle(title);
      addPara(content.join("\n"));
      y += 6;
    };
    let section: string[] = [];
    let currentTitle = "Overview";
    const flush = () => { if (section.length) { printSection(currentTitle, section); section = []; } };
    const isTitle = (s: string) =>
      ["Prioritized Keywords:", "Plan to reach", "Improved Summary:", "Suggested Bullets:",
       "Bucket Coverage:", "ATS Bullet Grades:", "Auto-Rewrites:", "JD-specific 75-word Summary:",
       "Cover Letter:", "ATS Format Lint:", "LinkedIn Headline Options:", "LinkedIn About:", "LinkedIn Featured bullets:"]
        .some(t => s.startsWith(t));
    for (const l of lines) {
      if (isTitle(l)) { flush(); currentTitle = l.replace(/:$/, ""); }
      else { section.push(l); }
    }
    flush();
    doc.save("jd-match-report.pdf");
  };

  /* =========================================================
     LinkedIn Pack state
     ========================================================= */
  const [atsResults, setAtsResults] = useState<LintItem[]>([]);
  const runAtsLint = () => setAtsResults(runATSLintNow(resume));

  const [liHeadlines, setLiHeadlines] = useState<string[]>([]);
  const [liAbout, setLiAbout] = useState<string>("");
  const [liBullets, setLiBullets] = useState<string[]>([]);
  const generateLinkedInPack = () => {
    const role = guessRole(jd) || "Digital Marketing";
    const headlines = makeLinkedInHeadlines(plan.prioritized, role);
    const about = makeLinkedInAbout(
      improvedSummaryText || makeSummary(plan.prioritized),
      bullets.length ? bullets : makeBullets(plan.prioritized, resume, 5),
      plan.prioritized
    );
    const featured = makeLinkedInFeatured(bullets.length ? bullets : makeBullets(plan.prioritized, resume, 3));
    setLiHeadlines(headlines); setLiAbout(about); setLiBullets(featured);
  };

  /* =========================================================
     Tab selection
     ========================================================= */
  const [active, setActive] = useState<TabKey>("tailor");
  const copy = (text: string) => navigator.clipboard.writeText(text);

  /* =========================================================
     Small helpers used in new tabs
     ========================================================= */
  // STAR builder state
  const [starS, setStarS] = useState(""); // Situation
  const [starT, setStarT] = useState(""); // Task
  const [starA, setStarA] = useState(""); // Action
  const [starR, setStarR] = useState(""); // Result
  const starCompose = () =>
    capWords(`${pickVerb()} ${plan.prioritized.slice(0,2).join(" & ")} — ${starA || "drove experiments"}; achieved ${starR || "+X% CTR / -Y% CPA"}.`, 26);

  // Cover variants
  function coverVariant(tone: "neutral"|"company"|"metrics"|"scrappy") {
    const base = makeCoverLetter(jd, resume, plan.prioritized);
    if (tone === "metrics") return base.replace("Highlights include", "Metrics I’m proud of include");
    if (tone === "company") return base.replace(/Hiring Manager/g, guessCompany(jd) || "Hiring Team");
    if (tone === "scrappy") return base + "\n\nPS: Happy to run a quick 3-day test plan to prove impact.";
    return base;
  }

  // Learn roadmap suggestions
  const learnList = useMemo(() => {
    const pri = plan.prioritized.slice(0, 10);
    const items = pri.map(k => {
      const cat = bucketOf(k);
      const todo = cat === "Channels" ? `Run a sandbox ${k} campaign with Rs 500 and write a 1-page readout.` :
        cat === "Analytics" ? `Complete a GA4 mini-project: event tracking + dashboard.` :
        cat === "Tools" ? `Do a 2-hour crash course on ${k} and build one micro-automation.` :
        `Ship one landing page test practising ${k}.`;
      return { k, cat, todo };
    });
    return items;
  }, [plan.prioritized]);

  // Interview Q-pack: simple heuristic
  const iq = useMemo(() => {
    const ch = plan.prioritized.filter(w => bucketOf(w) === "Channels").slice(0,3);
    const an = plan.prioritized.filter(w => bucketOf(w) === "Analytics").slice(0,2);
    const tl = plan.prioritized.filter(w => bucketOf(w) === "Tools").slice(0,2);
    return {
      technical: [
        `Walk me through a recent ${ch[0] || "paid"} campaign: goal, audiences, creatives, budgets, pacing, results.`,
        `How do you set up GA4 events and conversions? (${an[0] || "GA4"})`,
        `What would be your approach to reducing CPA on ${ch.join(" & ") || "paid"}?`,
      ],
      experiments: [
        `Propose 3 A/B tests for landing pages and how you’ll measure impact.`,
        `Describe your framework for test selection and sample-size.`,
      ],
      analytics: [
        `Build a basic funnel report and explain drop-offs (tools: ${tl.join(", ") || "Sheets"})`,
        `What dashboards would the hiring manager see weekly?`,
      ],
      culture: [
        `Tell us about a time you pushed back using data.`,
        `How do you partner with content/design to land experiments quickly?`,
      ],
    };
  }, [plan.prioritized]);

  // Shareable scorecard link (simple, client-only)
  const sharePayload = useMemo(() => {
    const obj = {
      score, target, buckets: bucketStats, prioritized: plan.prioritized.slice(0, 18),
      jd: jd.slice(0, 2000), // trim
    };
    const b64 = typeof window !== "undefined"
      ? window.btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      : "";
    return b64;
  }, [score, target, bucketStats, plan.prioritized, jd]);

  const shareUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/share?d=${sharePayload}`;
  }, [sharePayload]);

  /* =========================================================
     UI bits
     ========================================================= */
  const Bar = ({ pct }: { pct: number }) => (
    <div style={{ width: "100%", background: "#0b1220", borderRadius: 6, border: "1px solid #1f2937", height: 12 }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: "#0ea5e9" }} />
    </div>
  );
  const locked = !unlocked;

  return (
    <main style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Resume ↔ JD Matcher</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Runs fully in your browser. No data leaves your device. First run may take ~1–2 min to load the tiny model.
      </p>

      {/* SELL HERO — concise value prop + badges + primary CTA */}
<section
  aria-label="Overview"
  style={{
    margin: "8px 0 18px 0",
    padding: 12,
    border: "1px solid #1f2937",
    borderRadius: 12,
    background: "rgba(2,6,23,0.45)",
  }}
>
  <h2 style={{ fontSize: 20, margin: "0 0 6px 0" }}>
    Get hired faster with an ATS-friendly, JD-specific resume
  </h2>
  <ul style={{ margin: "6px 0 10px 18px", lineHeight: 1.6 }}>
    <li>Match score + missing keywords tailored to the exact JD</li>
    <li>Auto-rewrites for weak bullets (action verb + metric + impact)</li>
    <li>JD-specific 75-word summary and ready-to-send cover letter</li>
    <li>Private by design — <strong>everything runs in your browser</strong></li>
  </ul>

  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <a
      href="#workspace"
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #334155",
        background: "#0ea5e9",
        color: "#fff",
        textDecoration: "none",
      }}
    >
      Try it with the sample JD →
    </a>
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        border: "1px solid #334155",
        borderRadius: 10,
        fontSize: 12,
        opacity: 0.9,
      }}
    >
      ATS-friendly · No signup · ₹199 unlock for pro features
    </span>
  </div>
</section>

{/* Quick links (Studio first) */}
<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
  <a
    href="/studio"
    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", textDecoration: "none" }}
  >
    Studio →
  </a>
  <a
    href="/studio/ad"
    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", textDecoration: "none" }}
  >
    Ad Headline Generator →
  </a>
  <a
    href="/studio/email"
    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", textDecoration: "none" }}
  >
    Cold Emailer →
  </a>
  <a
    href="/studio/portfolio"
    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", textDecoration: "none" }}
  >
    Portfolio Builder →
  </a>
  <a
    href="/studio/templates"
    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", textDecoration: "none" }}
  >
    AI Template Store →
  </a>
</div>
      {/* Layout: left nav + right content */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        {/* Left sidebar */}
        <aside style={{ border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, opacity: 0.8 }}>Workspace</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {NAV_ITEMS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: active === key ? "1px solid #0ea5e9" : "1px solid #1f2937",
                  background: active === key ? "#0b1220" : "transparent",
                  color: active === key ? "#e5f2ff" : "#e5e7eb",
                  cursor: "pointer"
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14, fontSize:12, opacity:0.7 }}>
            {unlocked ? <span style={{color:"#22c55e"}}>Unlocked</span> :
              <button onClick={unlock} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>
                Unlock full results ₹199
              </button>}
          </div>
        </aside>

        {/* Right content (tabs) */}
        <section>
          {/* === TAB: TAILOR & EXPORT === */}
          {active === "tailor" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label>Job Description</label>
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    placeholder="Paste JD…"
                    style={{ width: "100%", height: 200, padding: 12 }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Resume</label>
                    <div>
                      <input type="file" accept=".pdf,.docx,.txt" onChange={handleResumeUpload} />
                      <button onClick={()=>{ setResume(""); setUploadName(""); }} style={{ marginLeft: 8, padding:"4px 8px", borderRadius:6, border:"1px solid #e2e8f0" }}>Clear</button>
                    </div>
                  </div>
                  {uploadingResume ? (
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Reading {uploadName}…</div>
                  ) : uploadName ? (
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Loaded: {uploadName}</div>
                  ) : null}
                  <textarea
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Paste resume text or upload a file…"
                    style={{ width: "100%", height: 200, padding: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                <label>Target score</label>
                <input
                  type="number" min={70} max={99} value={target}
                  onChange={(e)=>setTarget(Math.max(70, Math.min(99, Number(e.target.value)||90)))}
                  style={{ width: 70, padding: 6, borderRadius: 6, border: "1px solid #e2e8f0" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={analyze} disabled={loading || !jd || !resume}
                  style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#0ea5e9", color: "#fff" }}>
                  {loading ? "Analyzing…" : "Analyze"}
                </button>

                {!locked && (
                  <>
                    <button onClick={exportTxt} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      Export TXT
                    </button>
                    <button onClick={exportPDF} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      Export PDF
                    </button>
                    <span style={{ color: "#22c55e", fontSize: 14, marginLeft: 8 }}>Unlocked</span>
                  </>
                )}
              </div>

              {score !== null && (
                <div style={{ marginTop: 24, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                  <h3 style={{ marginTop: 0 }}>
                    Match Score: {score} (Target: {target})
                    {!locked && predicted != null ? <> • Predicted after fixes: <strong>{predicted}</strong></> : null}
                  </h3>

                  {/* Breakdown */}
                  <div style={{ margin: "6px 0 14px 0" }}>
                    <h4 style={{ margin: "8px 0" }}>Score Breakdown by Category</h4>
                    {(locked ? bucketStats.slice(0,2) : bucketStats).map((b, i) => {
                      const pct = b.total ? Math.round((b.covered / b.total) * 100) : 0;
                      return (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8 }}>
                            <span>{b.name}</span><span>{b.covered}/{b.total}</span>
                          </div>
                          <Bar pct={pct} />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ opacity: locked ? 0.9 : 1 }}>
                    <h4>Prioritized Missing Keywords</h4>
                    <ul>{(locked ? plan.prioritized.slice(0, 6) : plan.prioritized.slice(0, 20)).map((m, i) => (
                      <li key={i}>
                        {m} <span style={{ opacity: 0.6 }}>— {bucketOf(m)}</span>
                        {!locked && appliedKeywords.includes(m) ? <span style={{ color: "#16a34a", marginLeft: 6 }}>✓</span> : null}
                      </li>
                    ))}</ul>

                    <h4>Suggested Action Bullets</h4>
                    <ul>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>

                    {locked && (
                      <div style={{ marginTop: 12, padding: 12, background: "#fff6ed", border: "1px dashed #fdba74", borderRadius: 8 }}>
                        Unlock to view the full plan, improved summary, live keyword checklist, ATS grades, auto-rewrites, a 75-word JD summary,
                        ATS format lint and a LinkedIn pack — plus PDF export.
                      </div>
                    )}

                    {!locked && (
                      <>
                        <h4>Plan to reach {target}+</h4>
                        <ul>
                          <li><strong>Gap:</strong> {plan.gap} pts. Add ~{plan.needed} high-priority keywords.</li>
                          {plan.actions.map((a,i)=>(<li key={i}>{a}</li>))}
                        </ul>

                        {/* Improved summary (editable target) */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <h4 style={{ marginBottom: 0 }}>Improved Resume Summary</h4>
                          <button onClick={()=>copy(improvedSummaryText)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}>Copy</button>
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 8 }}>
                          {improvedSummaryText}
                        </div>

                        {/* Live Keyword Checklist */}
                        <h3 style={{ marginTop: 18 }}>Live Keyword Checklist</h3>
                        <p style={{ opacity: 0.8, marginTop: -6 }}>
                          Tick keywords then apply them directly to your summary or bullets. Predicted score and coverage update live.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          {["Channels","Skills","Analytics","Tools","Other"].map((bucket) => {
                            const list = groupedChecklist[bucket] || [];
                            if (!list.length) return null;
                            return (
                              <div key={bucket} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                  <h4 style={{ margin: "4px 0 8px 0" }}>{bucket}</h4>
                                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                                    {list.filter(k => appliedKeywords.includes(k)).length}/{list.length} applied
                                  </div>
                                </div>
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                  {list.map((kw) => {
                                    const checked = selectedKeywords.includes(kw);
                                    const applied = appliedKeywords.includes(kw);
                                    return (
                                      <li key={kw} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                                        <input type="checkbox" checked={checked} onChange={() => toggleChecklist(kw)} />
                                        <span style={{ textTransform: "lowercase" }}>{kw}</span>
                                        {applied ? <span style={{ color: "#16a34a", marginLeft: 4 }}>✓</span> : null}
                                      </li>
                                    );
                                  })}
                                </ul>

                                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                  <button onClick={()=>applyToSummary(bucket)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                    Add to Summary
                                  </button>
                                  <button onClick={()=>applyAsBullets(bucket)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                    Add as Bullets
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* JD-specific concise summary */}
                        <h3 style={{ marginTop: 18 }}>JD-specific 75-word Summary</h3>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <button onClick={generateConcise} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            Generate concise summary
                          </button>
                          {conciseSummary ? <button onClick={()=>copy(conciseSummary)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy</button> : null}
                        </div>
                        {conciseSummary && (
                          <div style={{ whiteSpace: "pre-wrap", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 8 }}>
                            {conciseSummary}
                          </div>
                        )}

                        {/* ATS Bullet Grader */}
                        <h3 style={{ marginTop: 18 }}>ATS Bullet Grader</h3>
                        <p style={{ opacity: 0.8 }}>Paste your bullets (one per line). Click Grade to see a score and specific fixes.</p>
                        <textarea
                          value={bulletInput}
                          onChange={(e)=>setBulletInput(e.target.value)}
                          placeholder="Paste bullets here (one per line)…"
                          style={{ width: "100%", height: 120, padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 8 }}
                        />
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <button onClick={runGrader} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Grade bullets</button>
                          {bulletGrades.length ? <button onClick={()=>copy(bulletGrades.map(g=>`[${g.score}] ${g.bullet} | Tips: ${g.tips.join("; ")}`).join("\n"))} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy results</button> : null}
                        </div>
                        {bulletGrades.length > 0 && (
                          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ textAlign: "left" }}>
                                  <th style={{ padding: 6 }}>Score</th>
                                  <th style={{ padding: 6 }}>Bullet</th>
                                  <th style={{ padding: 6 }}>Fixes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bulletGrades.map((g, i) => (
                                  <tr key={i} style={{ borderTop: "1px solid " + "#eee" }}>
                                    <td style={{ padding: 6, width: 70 }}>[{g.score}]</td>
                                    <td style={{ padding: 6 }}>{g.bullet}</td>
                                    <td style={{ padding: 6 }}>{g.tips.join(" • ") || "Looks strong."}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Auto-Rewrite */}
                        <h3 style={{ marginTop: 18 }}>Auto-Rewrite Weak Bullets</h3>
                        <p style={{ opacity: 0.8 }}>
                          One click to rewrite low-scoring bullets with strong verbs, JD keywords and metric placeholders (edit metrics to your real numbers).
                        </p>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <button onClick={rewriteLowBullets} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            Rewrite low-score bullets
                          </button>
                          {rewrites.length ? <button onClick={()=>copy(rewrites.map(r=>`• ${r.neu}`).join("\n"))} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy rewrites</button> : null}
                        </div>
                        {rewrites.length > 0 && (
                          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ textAlign: "left" }}>
                                  <th style={{ padding: 6, width: "50%" }}>Old</th>
                                  <th style={{ padding: 6, width: "50%" }}>New</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rewrites.map((r, i) => (
                                  <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                                    <td style={{ padding: 6 }}>{r.old}</td>
                                    <td style={{ padding: 6 }}>
                                      {r.neu}
                                      <div>
                                        <button onClick={()=>copy(r.neu)} style={{ marginTop: 6, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0" }}>Copy</button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* ATS FORMAT CHECK */}
                        <h3 style={{ marginTop: 18 }}>ATS Format Check (layout & content lint)</h3>
                        <p style={{ opacity: 0.8 }}>Quick static checks that catch tables/columns, images, non-ASCII characters, missing sections, mixed dates, long bullets, tabs and more.</p>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <button onClick={runAtsLint} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Run ATS lint</button>
                          {atsResults.length ? <button onClick={()=>copy(atsResults.map(it=>`[${it.level}] ${it.message}${it.hint? " — "+it.hint:""}`).join("\n"))} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy results</button> : null}
                        </div>
                        {atsResults.length > 0 && (
                          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8, marginBottom: 12 }}>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {atsResults.map((it, i) => (
                                <li key={i} style={{ margin: "6px 0" }}>
                                  <span style={{
                                    display: "inline-block", padding: "2px 6px", borderRadius: 6, marginRight: 8,
                                    background: it.level === "error" ? "#fee2e2" : it.level === "warn" ? "#fef3c7" : "#e0f2fe",
                                    color: "#111827", fontSize: 12
                                  }}>{it.level}</span>
                                  <strong>{it.message}</strong>{it.hint ? ` — ${it.hint}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* LinkedIn Pack */}
                        <h3 style={{ marginTop: 18 }}>LinkedIn Pack (Headline, About, Featured bullets)</h3>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <button onClick={generateLinkedInPack} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                            Generate LinkedIn pack
                          </button>
                        </div>

                        {liHeadlines.length > 0 && (
                          <>
                            <h4>Headline options (≤ 220 chars)</h4>
                            {liHeadlines.map((h, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <div style={{ flex: 1, padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}>{h}</div>
                                <span style={{ fontSize: 12, opacity: 0.7 }}>{h.length}/220</span>
                                <button onClick={()=>copy(h)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy</button>
                              </div>
                            ))}
                          </>
                        )}

                        {liAbout && (
                          <>
                            <h4>About (≤ 2,600 chars)</h4>
                            <div style={{ whiteSpace: "pre-wrap", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 8 }}>
                              {liAbout}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                              <span style={{ fontSize: 12, opacity: 0.7 }}>{liAbout.length}/2600</span>
                              <button onClick={()=>copy(liAbout)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy</button>
                            </div>
                          </>
                        )}

                        {liBullets.length > 0 && (
                          <>
                            <h4>Featured bullets</h4>
                            <ul>
                              {liBullets.map((b,i)=>(<li key={i}>{b}</li>))}
                            </ul>
                            <button onClick={()=>copy(liBullets.map(b=>"• "+b).join("\n"))} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy bullets</button>
                          </>
                        )}

                        {/* One-click Cover Letter */}
                        <h3 style={{ marginTop: 18 }}>One-click Cover Letter</h3>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                          <button onClick={generateCover} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Generate</button>
                          {coverLetter ? <button onClick={()=>copy(coverLetter)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>Copy</button> : null}
                        </div>
                        {coverLetter && (
                          <div style={{ whiteSpace: "pre-wrap", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                            {coverLetter}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* === TAB: STAR Story Builder === */}
          {active === "star" && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <h3>STAR Story Builder</h3>
              <p style={{ opacity: 0.8, marginTop: -6 }}>Draft concise STAR bullets aligned to this JD. Paste into your resume.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <div>
                  <label>Situation</label>
                  <textarea value={starS} onChange={(e)=>setStarS(e.target.value)} style={{ width:"100%", height:80, padding:10 }} />
                </div>
                <div>
                  <label>Task</label>
                  <textarea value={starT} onChange={(e)=>setStarT(e.target.value)} style={{ width:"100%", height:80, padding:10 }} />
                </div>
                <div>
                  <label>Action</label>
                  <textarea value={starA} onChange={(e)=>setStarA(e.target.value)} style={{ width:"100%", height:80, padding:10 }} />
                </div>
                <div>
                  <label>Result</label>
                  <textarea value={starR} onChange={(e)=>setStarR(e.target.value)} style={{ width:"100%", height:80, padding:10 }} />
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={()=>{
                  const b = starCompose();
                  setBullets(prev=>[b, ...prev]);
                  alert("Added to Suggested Bullets in Tailor tab.");
                }} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>Add as bullet</button>
                <button onClick={()=>copy(starCompose())} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>Copy</button>
              </div>
              <div style={{ marginTop:10, padding:10, border:"1px dashed #e5e7eb", borderRadius:8, whiteSpace:"pre-wrap" }}>
                {starCompose()}
              </div>
            </div>
          )}

          {/* === TAB: Cover Letter Variants === */}
          {active === "cover" && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <h3>Cover-Letter Variants</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {(["neutral","company","metrics","scrappy"] as const).map(mode => (
                  <div key={mode} style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:10 }}>
                    <div style={{ fontWeight:600, marginBottom:6 }}>{capitalise(mode)}</div>
                    <div style={{ whiteSpace:"pre-wrap" }}>{coverVariant(mode)}</div>
                    <div style={{ marginTop:8 }}>
                      <button onClick={()=>copy(coverVariant(mode))} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>Copy</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === TAB: Fix My Resume === */}
          {active === "fix" && (
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <h3>Fix My Resume</h3>
              <p style={{ opacity:0.8, marginTop:-6 }}>Auto-apply missing keywords to your summary and generate rewrites for weak bullets.</p>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <button onClick={()=>applyToSummary()} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>Apply top missing to Summary</button>
                <button onClick={rewriteLowBullets} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>Rewrite weak bullets</button>
              </div>
              <div style={{ whiteSpace:"pre-wrap", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 8 }}>
                {improvedSummaryText || "(Run Analyze first)"}
              </div>
              {rewrites.length > 0 && (
                <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:8 }}>
                  <h4>Rewrites</h4>
                  <ul>
                    {rewrites.map((r,i)=>(
                      <li key={i} style={{ margin:"6px 0" }}>
                        <div><strong>New:</strong> {r.neu}</div>
                        <button onClick={()=>copy(r.neu)} style={{ marginTop:6, padding:"4px 8px", borderRadius:6, border:"1px solid #e2e8f0" }}>Copy</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* === TAB: What to Learn Next === */}
          {active === "learn" && (
            <div style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
              <h3>What to Learn Next</h3>
              <p style={{ opacity:0.8, marginTop:-6 }}>A practical 2-week plan aligned to the JD gaps.</p>
              <ol>
                {learnList.map((x, i)=>(
                  <li key={i} style={{ margin:"8px 0" }}>
                    <strong>{capitalise(x.k)}</strong> — <span style={{ opacity:0.8 }}>{x.cat}</span>
                    <div>{x.todo}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* === TAB: Referral / Cold DM === */}
          {active === "referrals" && (
            <div style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
              <h3>Referral / Cold DM</h3>
              <p style={{ opacity:0.8, marginTop:-6 }}>Short messages you can send to a hiring manager or alum.</p>
              {[
                {title:"Ultra-short DM", body:`Hi — I noticed the opening for ${guessRole(jd) || "this role"}. I’ve run ${plan.prioritized.slice(0,2).join(" & ")} and improved CTR/CPA. Open to a quick chat?`},
                {title:"Referral ask", body:`Hey! Saw ${guessCompany(jd) || "your company"} hiring for ${guessRole(jd) || "a role"}. I’ve led ${plan.prioritized.slice(0,3).join(", ")}; happy to share a 1-pager. Could you refer me / suggest who to contact?`},
                {title:"Email (concise)", body:`Subject: Applying for ${guessRole(jd) || "Marketing role"}\n\nHi ${guessCompany(jd) || "team"},\nI’ve driven lift via A/B tests, GA4 and ${plan.prioritized.slice(0,2).join(" & ")}. Attaching a tailored resume. Would love to contribute — can we schedule 15 mins?\n\nThanks,\nYour Name`},
              ].map((m,i)=>(
                <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:10, marginBottom:10 }}>
                  <div style={{ fontWeight:600 }}>{m.title}</div>
                  <div style={{ whiteSpace:"pre-wrap", marginTop:6 }}>{m.body}</div>
                  <button onClick={()=>copy(m.body)} style={{ marginTop:8, padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>Copy</button>
                </div>
              ))}
            </div>
          )}

          {/* === TAB: Interview Q-Pack === */}
          {active === "interview" && (
            <div style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
              <h3>Interview Q-Pack (JD-specific)</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {Object.entries(iq).map(([sec, list])=>(
                  <div key={sec} style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:10 }}>
                    <div style={{ fontWeight:600, marginBottom:6 }}>{capitalise(sec)}</div>
                    <ul>
                      {list.map((q, i)=>(<li key={i} style={{ margin:"6px 0" }}>{q}</li>))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === TAB: Shareable Scorecard === */}
          {active === "share" && (
            <div style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
              <h3>Shareable Scorecard</h3>
              <p style={{ opacity:0.8, marginTop:-6 }}>Generate a read-only link with your score, buckets and prioritized keywords.</p>
              <div style={{ display:"flex", gap:8 }}>
                <input value={shareUrl} readOnly style={{ flex:1, padding:10, borderRadius:8, border:"1px solid #e2e8f0" }} />
                <button onClick={()=>copy(shareUrl)} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0" }}>Copy link</button>
              </div>
              <div style={{ marginTop:8, fontSize:12, opacity:0.7 }}>
                Tip: run <em>Analyze</em> first so the link contains fresh data.
              </div>
            </div>
          )}
        </section>
      </div>
      {/* ─────────────────────────────────────────────────────────────
    LONG-FORM SEO CONTENT (visible but lightweight)
    Place this just above </main>
────────────────────────────────────────────────────────────── */}
<section
  id="resume-jd-matcher-seo"
  aria-label="Resume to Job Description (JD) Matcher — details and FAQs"
  style={{
    marginTop: 28,
    padding: 16,
    border: "1px solid #1f2937",
    borderRadius: 12,
    background: "rgba(2,6,23,0.35)",
    lineHeight: 1.6,
  }}
>
  <h2 style={{ fontSize: 20, margin: "0 0 10px 0" }}>
    Resume ↔ JD Matcher — Tailor your resume to any job (ATS-friendly)
  </h2>

  <p style={{ opacity: 0.9 }}>
    Paste a job description and your resume to instantly get a match score, missing
    keywords, improvement ideas, and ready-to-paste highlights. Everything runs in
    your browser (no uploads), so it’s private by design and ATS-friendly from the start.
  </p>

  <h3 style={{ marginTop: 16 }}>How it works</h3>
  <ol style={{ paddingLeft: 18 }}>
    <li>Paste a <strong>Job Description</strong> and your <strong>Resume</strong> (or upload PDF/DOCX/TXT).</li>
    <li>Get a <strong>Match Score</strong>, find <strong>missing keywords</strong>, and see a category breakdown.</li>
    <li>Generate <strong>improved bullets</strong>, a <strong>JD-specific summary</strong>, and a <strong>cover letter</strong>.</li>
    <li>Export your plan, copy fixes, or tailor &amp; export for each job in one click.</li>
  </ol>

  <h3 style={{ marginTop: 16 }}>Why candidates use this</h3>
  <ul style={{ paddingLeft: 18 }}>
    <li><strong>ATS-friendly</strong> output (clear headings, keyword coverage, tangible impact).</li>
    <li><strong>Privacy</strong>: runs locally in your browser; your documents never leave your device.</li>
    <li><strong>Job-specific</strong> suggestions (not generic resume tips).</li>
    <li><strong>Fast iteration</strong> for multiple applications with Tailor &amp; Export.</li>
  </ul>

  <h3 style={{ marginTop: 16 }}>Supported formats &amp; exports</h3>
  <p style={{ opacity: 0.9 }}>
    Import <strong>PDF</strong>, <strong>DOCX</strong>, or <strong>TXT</strong>. Export <strong>TXT</strong> or <strong>PDF</strong> reports.
  </p>

  <h3 style={{ marginTop: 16 }}>Pricing</h3>
  <p style={{ opacity: 0.9 }}>
    Free preview to check your match. Unlock pro actions (auto-rewrites, concise summary,
    cover letter, ATS lint, LinkedIn pack, tailored export) for a small one-time fee.
  </p>

  <h3 style={{ marginTop: 16 }}>Use cases &amp; keywords</h3>
  <p style={{ opacity: 0.9 }}>
    Resume to job description match, CV keyword optimizer, ATS resume checker, resume keyword
    coverage, JD-based resume tailoring, resume bullet generator, cover letter generator,
    LinkedIn headline/About optimizer.
  </p>

  <h3 style={{ marginTop: 16 }}>FAQs</h3>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>Is my data safe?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      Yes. All analysis runs in your browser using a small on-device model. Your files are
      not uploaded to any server.
    </p>
  </details>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>Will this make my resume ATS-friendly?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      It flags layout issues (tables, images, fancy bullets, mixed dates) and suggests concise,
      metric-first bullets that parse cleanly in most applicant tracking systems.
    </p>
  </details>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>How is the match score calculated?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      We embed both documents and compute semantic similarity, plus a category coverage check
      for channels, skills, analytics and tools.
    </p>
  </details>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>Can I tailor for multiple jobs quickly?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      Yes — use Tailor &amp; Export to inject JD keywords into your headline and bullets, then export
      a tailored version for each role.
    </p>
  </details>
</section>
<script
  type="application/ld+json"
  suppressHydrationWarning
  dangerouslySetInnerHTML={{
    __html: `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Resume ↔ JD Matcher",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "199.00",
        "priceCurrency": "INR"
      },
      "description": "ATS-friendly resume optimizer that matches your resume to job descriptions, generates tailored cover letters, interview Q&As, and outreach messages — all in-browser with no data leaving your device.",
      "url": "https://www.jdmatcher.com"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Does my data leave my device?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. The tool runs entirely in your browser. Files are processed locally."
          }
        },
        {
          "@type": "Question",
          "name": "Can I export tailored resumes and cover letters?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. You can export DOCX/PDF and generate multiple company-specific variants."
          }
        },
        {
          "@type": "Question",
          "name": "How much does it cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Core features are free to try; advanced exports and packs are available at a nominal fee (₹100–₹500)."
          }
        }
      ]
    }
  ]
}`
  }}
/>
 {/* ─────────────────────────────────────────────────────────────
    LONG-FORM SEO CONTENT (visible but lightweight)
    Place this just above </main>
────────────────────────────────────────────────────────────── */}
<section
  id="resume-jd-matcher-seo"
  aria-label="Resume to Job Description (JD) Matcher — details and FAQs"
  style={{
    marginTop: 28,
    padding: 16,
    border: "1px solid #1f2937",
    borderRadius: 12,
    background: "rgba(2,6,23,0.35)",
    lineHeight: 1.6,
  }}
>
  <h2 style={{ fontSize: 20, margin: "0 0 10px 0" }}>
    Resume ↔ JD Matcher — Tailor your resume to any job (ATS-friendly)
  </h2>

  <p style={{ opacity: 0.9 }}>
    Paste a job description and your resume to instantly get a match score, missing
    keywords, improvement ideas, and ready-to-paste highlights. Everything runs in
    your browser (no uploads), so it’s private by design and ATS-friendly from the start.
  </p>

  <h3 style={{ marginTop: 16 }}>How it works</h3>
  <ol style={{ paddingLeft: 18 }}>
    <li>Paste a <strong>Job Description</strong> and your <strong>Resume</strong> (or upload PDF/DOCX/TXT).</li>
    <li>Get a <strong>Match Score</strong>, find <strong>missing keywords</strong>, and see a category breakdown.</li>
    <li>Generate <strong>improved bullets</strong>, a <strong>JD-specific summary</strong>, and a <strong>cover letter</strong>.</li>
    <li>Export your plan, copy fixes, or tailor &amp; export for each job in one click.</li>
  </ol>

  <h3 style={{ marginTop: 16 }}>Why candidates use this</h3>
  <ul style={{ paddingLeft: 18 }}>
    <li><strong>ATS-friendly</strong> output (clear headings, keyword coverage, tangible impact).</li>
    <li><strong>Privacy</strong>: runs locally in your browser; your documents never leave your device.</li>
    <li><strong>Job-specific</strong> suggestions (not generic resume tips).</li>
    <li><strong>Fast iteration</strong> for multiple applications with Tailor &amp; Export.</li>
  </ul>

  <h3 style={{ marginTop: 16 }}>Supported formats &amp; exports</h3>
  <p style={{ opacity: 0.9 }}>
    Import <strong>PDF</strong>, <strong>DOCX</strong>, or <strong>TXT</strong>. Export <strong>TXT</strong> or <strong>PDF</strong> reports.
  </p>

  <h3 style={{ marginTop: 16 }}>Pricing</h3>
  <p style={{ opacity: 0.9 }}>
    Free preview to check your match. Unlock pro actions (auto-rewrites, concise summary,
    cover letter, ATS lint, LinkedIn pack, tailored export) for a small one-time fee.
  </p>

  <h3 style={{ marginTop: 16 }}>Use cases &amp; keywords</h3>
  <p style={{ opacity: 0.9 }}>
    Resume to job description match, CV keyword optimizer, ATS resume checker, resume keyword
    coverage, JD-based resume tailoring, resume bullet generator, cover letter generator,
    LinkedIn headline/About optimizer.
  </p>

  <h3 style={{ marginTop: 16 }}>FAQs</h3>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>Is my data safe?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      Yes. All analysis runs in your browser using a small on-device model. Your files are
      not uploaded to any server.
    </p>
  </details>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>Will this make my resume ATS-friendly?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      It flags layout issues (tables, images, fancy bullets, mixed dates) and suggests concise,
      metric-first bullets that parse cleanly in most applicant tracking systems.
    </p>
  </details>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>How is the match score calculated?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      We embed both documents and compute semantic similarity, plus a category coverage check
      for channels, skills, analytics and tools.
    </p>
  </details>

  <details style={{ margin: "8px 0" }}>
    <summary><strong>Can I tailor for multiple jobs quickly?</strong></summary>
    <p style={{ marginTop: 6, opacity: 0.9 }}>
      Yes — use Tailor &amp; Export to inject JD keywords into your headline and bullets, then export
      a tailored version for each role.
    </p>
  </details>
</section>

{/* Single, valid JSON-LD block (keep only this one) */}
<script
  type="application/ld+json"
  suppressHydrationWarning
  dangerouslySetInnerHTML={{
    __html: `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Resume ↔ JD Matcher",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "199.00",
        "priceCurrency": "INR"
      },
      "description": "ATS-friendly resume optimizer that matches your resume to job descriptions, generates tailored cover letters, interview Q&As, and outreach messages — all in-browser with no data leaving your device.",
      "url": "https://www.jdmatcher.com"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Does my data leave my device?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. The tool runs entirely in your browser. Files are processed locally."
          }
        },
        {
          "@type": "Question",
          "name": "Can I export tailored resumes and cover letters?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. You can export DOCX/PDF and generate multiple company-specific variants."
          }
        },
        {
          "@type": "Question",
          "name": "How much does it cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Core features are free to try; advanced exports and packs are available at a nominal fee (₹100–₹500)."
          }
        }
      ]
    }
  ]
}`
  }}
/>

</main>
  );
}
