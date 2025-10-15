"use client";

import React, { useMemo, useState } from "react";

/* ──────────────────────────────────────────────────────────────
   Config: Expanded options
   ────────────────────────────────────────────────────────────── */
const TONES = [
  "Warm",
  "Direct",
  "Friendly",
  "Professional",
  "Consultative",
  "Challenger",
  "Curious",
  "Data-driven",
  "Humble",
  "Bold",
  "Playful",
  "Formal",
  "Casual",
  "Empathetic",
  "Urgent",
  "Storytelling",
  "Value-first",
  "Question-led",
  "No-nonsense",
  "Positive",
  "Neutral",
  "Skeptical (soft)",
  "Helpful",
  "Short & punchy",
  "Long-form",
  "Founder-to-founder",
  "Peer-to-peer",
  "CFO-friendly",
  "Technical",
  "Non-technical",
  "Results-focused",
  "Pain-first",
  "Challenge-the-status-quo",
  "Polite follow-up",
  "Bump",
  "Last attempt",
] as const;

const CTAS = [
  "Can I send 2–3 quick ideas?",
  "Open to a 12-min chat next week?",
  "Should I share a 1-pager with examples?",
  "If not you, who owns this at {{company}}?",
  "Want me to send a loom (2 min) with ideas?",
  "Should I put a 2-slide teardown in your inbox?",
  "May I share 3 specific fixes we’ve used for similar teams?",
  "Want a before-after mockup?",
  "Happy to share benchmarks for your space",
  "Can I send a rough plan tailored to {{company}}?",
  "Want me to send pricing ballpark first?",
  "Mind if I follow up with a sample?",
  "Should I send ad headline/angle ideas?",
  "Worth a quick 15-min intro?",
  "Point me to the right person?",
  "Is <Tue/Wed> good for a quick call?",
  "Can I share benchmarks for your niche?",
  "Open to trying one idea for 10 days?",
  "Can I send pricing ballpark?",
  "Should I stop here?",
  "Custom…",
] as const;

type Tone = (typeof TONES)[number];
type Cta = (typeof CTAS)[number];

type Prospect = { name: string; company: string; pain: string };

/* ──────────────────────────────────────────────────────────────
   Utils
   ────────────────────────────────────────────────────────────── */

function safeTrim(s: string | undefined | null) {
  return (s ?? "").trim();
}

/** Parse simple CSV or line-by-line values of `name,company,pain`. */
function parseList(text: string): Prospect[] {
  const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  // If first row looks like a header
  const header = lines[0].toLowerCase();
  const start = /name\s*,\s*company\s*,\s*pain/.test(header) ? 1 : 0;

  const out: Prospect[] = [];
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(",").map((x) => x.trim());
    out.push({
      name: parts[0] || "",
      company: parts[1] || "",
      pain: parts.slice(2).join(", ") || "", // allow commas inside pain
    });
  }
  return out;
}

function replaceTags(s: string, p: Prospect, keepTags: boolean) {
  if (keepTags) return s;
  return s
    .replaceAll("{{name}}", p.name || "there")
    .replaceAll("{{company}}", p.company || "your company")
    .replaceAll("{{pain}}", p.pain || "this");
}

function shortOffer(offer: string) {
  const s = offer.trim();
  if (s.length <= 36) return s;
  return s.slice(0, 34) + "…";
}

/* ──────────────────────────────────────────────────────────────
   Variant generator
   ────────────────────────────────────────────────────────────── */

type EmailVariant = { subject: string; body: string };

function generateVariants(
  p: Prospect,
  offer: string,
  tone: Tone,
  cta: string,
  keepTags: boolean
): EmailVariant[] {
  const SO = shortOffer(offer || "growth ideas");

  // Templates are neutral; tone nudges phrasing slightly.
  const subjectTemplates = [
    `{{company}} × ${SO}`,
    `${SO} for {{company}}`,
    `Quick idea on {{pain}}`,
  ];

  const bodyTemplates = [
    // v1
    [
      `Hi {{name}},`,
      `Noticed {{company}} mentioned "{{pain}}". I help teams with ${offer}.`,
      `If helpful, I can share 2–3 quick ideas tailored to {{company}}.`,
      `— ${cta}`,
    ],
    // v2
    [
      `Hey {{name}},`,
      `Curious if {{company}} is exploring ${offer}. Often see "{{pain}}" slow things down.`,
      `Happy to send a 1-pager with examples or a short loom.`,
      `— ${cta}`,
    ],
    // v3
    [
      `Hi {{name}},`,
      `I work on ${offer}. Based on what I see publicly, {{company}} might be feeling "{{pain}}".`,
      `Open to a quick chat? Can also just send a rough plan.`,
      `— ${cta}`,
    ],
  ];

  // Tone tweaks (very lightweight)
  const toneLower = tone.toLowerCase();
  const soften =
    toneLower.includes("warm") ||
    toneLower.includes("friendly") ||
    toneLower.includes("empathetic");
  const punchy =
    toneLower.includes("direct") ||
    toneLower.includes("no-nonsense") ||
    toneLower.includes("short");

  const subject = subjectTemplates.map((t) => replaceTags(t, p, keepTags));
  const bodies = bodyTemplates.map((lines) => {
    let b = lines.slice();

    if (soften) {
      b[1] = b[1].replace("I help teams", "I usually help teams");
    }
    if (punchy) {
      b[2] = b[2].replace("Happy to send a 1-pager with examples or a short loom.", "Can send a 1-pager or a 120-sec loom.");
    }

    const joined = b.join("\n\n");
    return replaceTags(joined, p, keepTags);
  });

  const final = subject.map((s, i) => ({
    subject: s,
    body: bodies[i],
  }));

  // Inject CTA (already inside body templates as "— ${cta}")
  return final.map((v) => ({
    subject: v.subject,
    body: v.body.replace("— " + cta, "— " + replaceTags(cta, p, keepTags)),
  }));
}

/* ──────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────── */

export default function EmailPage() {
  // Left setup
  const [offer, setOffer] = useState("performance marketing / CRO");
  const [tone, setTone] = useState<Tone>("Warm");
  const [cta, setCta] = useState<Cta>("Can I send 2–3 quick ideas?");
  const [customCta, setCustomCta] = useState("");
  const [keepTags, setKeepTags] = useState(false);

  // Prospect side
  const [listText, setListText] = useState(
    [
      "name,company,pain",
      "Arun,AcmeCo,high CPA on paid search",
      "Meera,CreditNest,low demo-to-close",
      "Rohit,GrowthKart,landing page drop-offs",
    ].join("\n")
  );

  // Preview prospect (when list is empty)
  const [previewName, setPreviewName] = useState("Priya");
  const [previewCompany, setPreviewCompany] = useState("Northstar Labs");
  const [previewPain, setPreviewPain] = useState("high CPL from Meta");

  // Derived data
  const prospects: Prospect[] = useMemo(() => {
    const parsed = parseList(listText);
    if (parsed.length) return parsed;
    return [{ name: previewName, company: previewCompany, pain: previewPain }];
  }, [listText, previewName, previewCompany, previewPain]);

  const actualCta = cta === "Custom…" ? customCta || "Open to a quick chat?" : cta;

  const generated = useMemo(() => {
    return prospects.map((p) =>
      generateVariants(p, offer, tone, actualCta, keepTags)
    );
  }, [prospects, offer, tone, actualCta, keepTags]);

  // UI helpers
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      alert("Copy failed. Select & copy manually.");
    }
  };

  const loadExample = () =>
    setListText(
      [
        "name,company,pain",
        "Arun,AcmeCo,high CPA on paid search",
        "Meera,CreditNest,low demo-to-close",
        "Rohit,GrowthKart,landing page drop-offs",
      ].join("\n")
    );

  const clearList = () => setListText("");

  // Styles
  const panel: React.CSSProperties = {
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 16,
    background: "rgba(255,255,255,0.02)",
  };
  const label: React.CSSProperties = { fontWeight: 600, marginBottom: 6 };
  const inp: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#0b0f19",
    color: "#e5e7eb",
  };
  const btn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#0b0f19",
    color: "#e5e7eb",
    cursor: "pointer",
  };
  const card: React.CSSProperties = {
    border: "1px solid #1f2937",
    borderRadius: 10,
    padding: 12,
    background: "#0b0f19",
  };

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Cold Emailer (B2B Freelancers)</h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        3 subject-body variants with {"{{name}}"}, {"{{company}}"} and {"{{pain}}"} merge tags. Paste a simple list to generate many emails at once.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left: Setup */}
        <div style={panel}>
          <div style={label}>Setup</div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Your offer</div>
            <input
              style={inp}
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="e.g., performance marketing, CRO, GA4, content, etc."
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Tone</div>
            <select
              style={inp}
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={label}>Call-to-Action</div>
            <select
              style={inp}
              value={cta}
              onChange={(e) => setCta(e.target.value as Cta)}
            >
              {CTAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {cta === "Custom…" && (
              <input
                style={{ ...inp, marginTop: 8 }}
                placeholder="Type your custom CTA…"
                value={customCta}
                onChange={(e) => setCustomCta(e.target.value)}
              />
            )}
          </div>

          <div>
            <div style={label}>Preview prospect (when list empty)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                style={inp}
                placeholder="Name"
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
              />
              <input
                style={inp}
                placeholder="Company"
                value={previewCompany}
                onChange={(e) => setPreviewCompany(e.target.value)}
              />
            </div>
            <input
              style={{ ...inp, marginTop: 8 }}
              placeholder="Pain"
              value={previewPain}
              onChange={(e) => setPreviewPain(e.target.value)}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={keepTags}
              onChange={(e) => setKeepTags(e.target.checked)}
            />
            Keep merge tags (do not replace {"{{name}}"}, {"{{company}}"}, {"{{pain}}"})
          </label>
        </div>

        {/* Right: Prospect list */}
        <div style={panel}>
          <div style={label}>Prospect list</div>
          <div style={{ marginBottom: 6, opacity: 0.8 }}>
            Paste CSV (with or without header): <code>name, company, pain</code>
          </div>
          <textarea
            style={{ ...inp, height: 260, resize: "vertical" }}
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            placeholder={"name,company,pain\nAnita,Acme,high CPA\n…"}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button style={btn} onClick={loadExample}>
              Load example
            </button>
            <button style={btn} onClick={clearList}>
              Clear
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            {parseList(listText).length
              ? `${parseList(listText).length} prospects parsed`
              : "0 prospects (using preview prospect)"}
          </div>
        </div>
      </div>

      {/* Output */}
      <div style={{ marginTop: 18 }}>
        <h3 style={{ margin: "6px 0 10px" }}>
          Generated Emails{" "}
          <span style={{ opacity: 0.7 }}>
            ({prospects.length} prospect{prospects.length === 1 ? "" : "s"})
          </span>
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {generated.map((variants, idx) => {
            const p = prospects[idx];
            return (
              <div key={idx} style={card}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {p.name} • {p.company} • {p.pain}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                  }}
                >
                  {variants.map((v, i) => {
                    const full = `Subject: ${v.subject}\n\n${v.body}`;
                    return (
                      <div key={i} style={{ ...panel, padding: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>
                          {v.subject}
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: "pre-wrap",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                            fontSize: 13,
                          }}
                        >
                          {v.body}
                        </pre>
                        <div style={{ marginTop: 8 }}>
                          <button style={btn} onClick={() => copy(full)}>
                            Copy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
