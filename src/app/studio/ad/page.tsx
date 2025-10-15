"use client";

import React, { useMemo, useState } from "react";

type AdVariant = { headline: string; primary: string; desc: string };

const tones = ["Neutral", "Professional", "Friendly", "Bold", "Playful", "Urgent"] as const;
const platforms = ["Google", "Facebook", "LinkedIn", "X/Twitter"] as const;

function clampLen(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

export default function AdGenPage() {
  const [product, setProduct] = useState("Landing page CRO service");
  const [audience, setAudience] = useState("D2C founders in India");
  const [benefit, setBenefit] = useState("Increase conversion rate and lower CPA");
  const [keywords, setKeywords] = useState("CRO, GA4, A/B testing, landing pages");
  const [tone, setTone] = useState<(typeof tones)[number]>("Professional");
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("Google");
  const [proof, setProof] = useState("Case study: +38% CVR in 6 weeks");

  const variants: AdVariant[] = useMemo(() => {
    const kws = keywords.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    const k1 = kws[0] || "CRO";
    const k2 = kws[1] || "A/B test";

    const openers = {
      Neutral: ["Get results", "Improve performance", "Unlock growth"],
      Professional: ["Drive measurable impact", "Operationalize experiments", "Scale results"],
      Friendly: ["Make your ads work harder", "Turn clicks into customers", "Boost signups fast"],
      Bold: ["Crush your CPA", "Dominate conversions", "Outconvert competitors"],
      Playful: ["Give your funnel superpowers", "Make landing pages sing", "Turn ‘meh’ into ‘wow’"],
      Urgent: ["Stop leaking conversions", "Fix poor CVR now", "Slash CPA this quarter"],
    }[tone];

    const hMax = platform === "Google" ? 30 : 60;
    const dMax = platform === "Google" ? 90 : 100;
    const pMax = platform === "Facebook" ? 125 : 180;

    const base = [
      {
        headline: clampLen(`${product}: ${benefit}`, hMax),
        primary: clampLen(`${openers[0]} for ${audience}. ${proof}.`, pMax),
        desc: clampLen(`${k1}, ${k2}, ${benefit}. Book a quick audit.`, dMax),
      },
      {
        headline: clampLen(`${benefit} for ${audience}`, hMax),
        primary: clampLen(`${product} using ${k1} & ${k2}. ${proof}.`, pMax),
        desc: clampLen(`See how peers improved CVR. Free 20-min consult.`, dMax),
      },
      {
        headline: clampLen(`${product} — ${openers[1]}`, hMax),
        primary: clampLen(`Designed for ${audience}. ${benefit}.`, pMax),
        desc: clampLen(`${proof}. Start with a no-pressure audit call.`, dMax),
      },
      {
        headline: clampLen(`${openers[2]} with ${product}`, hMax),
        primary: clampLen(`${benefit}. ${k1} + ${k2} playbook.`, pMax),
        desc: clampLen(`Actionable insights in 7 days. Book a slot.`, dMax),
      },
    ];
    return base;
  }, [product, audience, benefit, keywords, tone, platform, proof]);

  const copy = (t: string) => navigator.clipboard.writeText(t);

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ margin: 0 }}>Ad Headline & Description Generator</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Quick variants by audience, tone and platform limits. Runs fully in-browser.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
        <div>
          <label>Product/Offer</label>
          <input value={product} onChange={(e) => setProduct(e.target.value)} style={inp} />
        </div>
        <div>
          <label>Audience</label>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} style={inp} />
        </div>
        <div>
          <label>Main benefit</label>
          <input value={benefit} onChange={(e) => setBenefit(e.target.value)} style={inp} />
        </div>
        <div>
          <label>Keywords (comma separated)</label>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} style={inp} />
        </div>
        <div>
          <label>Proof/snippet</label>
          <input value={proof} onChange={(e) => setProof(e.target.value)} style={inp} />
        </div>
        <div>
          <label>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value as any)} style={inp}>
            {tones.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value as any)} style={inp}>
            {platforms.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Variants</h3>
        {variants.map((v, i) => (
          <div key={i} style={card}>
            <div><strong>Headline</strong> — {v.headline} <Btn onClick={() => copy(v.headline)}>Copy</Btn></div>
            <div style={{ marginTop: 6 }}><strong>Primary</strong> — {v.primary} <Btn onClick={() => copy(v.primary)}>Copy</Btn></div>
            <div style={{ marginTop: 6 }}><strong>Description</strong> — {v.desc} <Btn onClick={() => copy(v.desc)}>Copy</Btn></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: 10, borderRadius: 8, border: "1px solid #1f2937", background: "#0b1220", color: "#e5e7eb"
};
const card: React.CSSProperties = { border: "1px solid #1f2937", borderRadius: 10, padding: 12, marginBottom: 10, background: "#0b1220" };
function Btn({ onClick, children }: { onClick(): void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ marginLeft: 8, padding: "4px 8px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#e5e7eb" }}>
      {children}
    </button>
  );
}
