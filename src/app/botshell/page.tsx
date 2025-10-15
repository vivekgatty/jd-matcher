export const dynamic = "force-static";

export const metadata = {
  title: "Resume ↔ JD Matcher",
  description:
    "Tailor your resume to any job: match score, missing keywords, ATS-friendly rewrites, 75-word JD summary, cover letter, and more — all in your browser.",
  alternates: { canonical: "/" },
};

export default function BotShell() {
  const jsonLd = `{
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Resume ↔ JD Matcher",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "199.00", "priceCurrency": "INR" },
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
              "text": "Yes. You can export and generate multiple company-specific variants."
            }
          },
          {
            "@type": "Question",
            "name": "How much does it cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Core features are free to try; advanced exports and packs are available at a nominal fee."
            }
          }
        ]
      }
    ]
  }`;

  return (
    <main style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Resume ↔ JD Matcher</h1>
      <p style={{ opacity: 0.9 }}>
        Tailor your resume to any job description. Get a match score, missing keywords,
        ATS-friendly bullet rewrites, a JD-specific summary and a ready-to-send cover letter.
        Runs fully in your browser — no uploads.
      </p>
      <ul>
        <li>Match score + keyword gaps by category</li>
        <li>Auto-rewrites for weak bullets</li>
        <li>75-word JD summary & cover letter</li>
        <li>Private by design — on-device</li>
      </ul>
      <p><a href="/" style={{ textDecoration: "none" }}>Open the app →</a></p>

      <h2 style={{ marginTop: 24 }}>FAQs</h2>
      <p><strong>Is my data safe?</strong> Yes — everything runs in your browser.</p>
      <p><strong>Is it ATS-friendly?</strong> Yes — clear sections, metrics, and keyword coverage.</p>
      <p><strong>Pricing?</strong> Free preview; unlock pro actions for a small one-time fee.</p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </main>
  );
}
