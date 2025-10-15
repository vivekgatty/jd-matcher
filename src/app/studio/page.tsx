import Link from "next/link";
import type { Metadata } from "next";

/** SEO */
export const metadata: Metadata = {
  title:
    "Studio — Ad Headline Generator, Cold Emailer, Portfolio Builder & AI Template Store",
  description:
    "Ship high-converting ad copy, send warm B2B cold emails, and publish a one-file portfolio. Save reusable AI templates. 100% browser-based, no logins or API keys.",
  keywords: [
    "ad headline generator",
    "google ads headline generator",
    "facebook ads primary text",
    "ad copy generator",
    "cold email generator",
    "B2B cold email",
    "sales outreach",
    "portfolio page generator",
    "one file portfolio",
    "AI template store",
    "resume JD matcher",
    "ATS resume",
    "SEO marketing tools",
    "marketing copy tools",
  ],
  alternates: { canonical: "/studio" },
  openGraph: {
    title:
      "Studio — Ad Generator, Cold Emailer, Portfolio Builder & AI Template Store",
    description:
      "Create better ads, emails and portfolios in minutes. Keep your work private—everything runs in your browser.",
    url: "/studio",
    type: "website",
  },
};

/** Small UI helpers */
const h2: React.CSSProperties = { fontSize: 22, margin: "8px 0 6px 0" };
const p: React.CSSProperties = { opacity: 0.9, lineHeight: 1.6, margin: "6px 0" };
const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  border: "1px solid #334155",
  borderRadius: 8,
  marginRight: 8,
  fontSize: 12,
  opacity: 0.9,
};
const btn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #334155",
  textDecoration: "none",
  marginTop: 8,
};
const card: React.CSSProperties = {
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 16,
  background: "rgba(2,6,23,0.4)",
};

export default function StudioPage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      {/* Hero */}
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 28, marginBottom: 10 }}>
          Studio — tiny growth tools that pay for themselves
        </h1>
        <p style={p}>
          Launch copy that converts, send outreach that gets replies, and publish a
          clean portfolio — all in minutes. <strong>No logins, no API keys</strong>,
          and your data never leaves your browser.
        </p>
        <div style={{ marginTop: 10 }}>
          <span style={badge}>Private by design</span>
          <span style={badge}>Works fully in-browser</span>
          <span style={badge}>One-time, low cost</span>
        </div>
      </header>

      {/* Product grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginTop: 10,
        }}
      >
        {/* Ad Generator */}
        <article style={card}>
          <h2 style={h2}>Ad Headline & Primary Text Generator</h2>
          <p style={p}>
            Generate <strong>Google Ads headlines</strong>,{" "}
            <strong>Meta/Facebook primary text</strong>, and short descriptions
            tuned by audience, tone, and benefit. Built to beat writer’s block and
            speed up testing.
          </p>
          <ul style={{ margin: "8px 0 0 18px", lineHeight: 1.6 }}>
            <li>Audience + tone sliders for instant variants</li>
            <li>Outputs you can paste straight into Ads Manager</li>
            <li>Clean, non-fluffy copy that stays on-brief</li>
          </ul>
          <Link href="/studio/ad" style={btn}>
            Launch Ad Generator →
          </Link>
        </article>

        {/* Cold Emailer */}
        <article style={card}>
          <h2 style={h2}>Cold Emailer (B2B Freelancer & SDR)</h2>
          <p style={p}>
            Write warm, short <strong>B2B cold emails</strong> that reference{" "}
            <em>name, company, pain</em> merge tags. Paste a CSV, export replies-ready
            emails. Designed to feel 1:1, not spammy.
          </p>
          <ul style={{ margin: "8px 0 0 18px", lineHeight: 1.6 }}>
            <li>3 variant subject+body lines per prospect</li>
            <li>Proven CTAs like “2–3 quick ideas?” or “worth a 7-min loom?”</li>
            <li>Great for performance marketing, CRO, dev & design</li>
          </ul>
          <Link href="/studio/email" style={btn}>
            Start Emailing →
          </Link>
        </article>

        {/* Portfolio Builder */}
        <article style={card}>
          <h2 style={h2}>One-File Portfolio Page Generator</h2>
          <p style={p}>
            Build a <strong>lightning-fast portfolio</strong> in a single HTML file.
            Drop it on any host (or share as a file) — zero build steps, zero
            dependencies.
          </p>
          <ul style={{ margin: "8px 0 0 18px", lineHeight: 1.6 }}>
            <li>Clean sections: About, Work, Case Studies, Contact</li>
            <li>File-based — stays portable, easy to edit later</li>
            <li>Perfect for indie hackers & freelancers</li>
          </ul>
          <Link href="/studio/portfolio" style={btn}>
            Build My Portfolio →
          </Link>
        </article>

        {/* Template Store */}
        <article style={card}>
          <h2 style={h2}>AI Template Store (Save & Reuse Prompts)</h2>
          <p style={p}>
            Save your best prompts and micro-workflows as reusable templates.
            Standardize quality across ads, emails and landing pages — and share
            with your team.
          </p>
          <ul style={{ margin: "8px 0 0 18px", lineHeight: 1.6 }}>
            <li>Click-to-copy templates for daily tasks</li>
            <li>Organize by tags & use cases</li>
            <li>Great companion to the Ad & Email tools</li>
          </ul>
          <Link href="/studio/templates" style={btn}>
            Browse Templates →
          </Link>
        </article>
      </section>

      {/* Social proof / benefits */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ ...h2, fontSize: 20 }}>Why marketers & job-seekers use Studio</h2>
        <ul style={{ marginLeft: 18, lineHeight: 1.8 }}>
          <li>
            <strong>Faster to first draft:</strong> go from blank page to 5–10 solid
            options in a minute.
          </li>
          <li>
            <strong>Private by default:</strong> everything runs on your device —
            keep client resumes, prospect lists and creative data off the cloud.
          </li>
          <li>
            <strong>One-time, nominal pricing:</strong> buy once, use forever. Ideal
            for India pricing (₹100–₹500).
          </li>
          <li>
            <strong>Plays nicely with your stack:</strong> copy-paste straight into
            Ads Manager, Gmail, Notion, or Sheets.
          </li>
        </ul>
      </section>

      {/* Cross-link back to the main app for internal SEO */}
      <section style={{ marginTop: 22 }}>
        <h2 style={{ ...h2, fontSize: 20 }}>Also try: Resume ↔ JD Matcher</h2>
        <p style={p}>
          Score your resume against a job description, get a prioritized keyword plan,
          rewrite bullets, and auto-generate a JD-specific summary and cover letter.
        </p>
        <Link href="/" style={btn}>
          Go to Resume ↔ JD Matcher →
        </Link>
      </section>
    </main>
  );
}
