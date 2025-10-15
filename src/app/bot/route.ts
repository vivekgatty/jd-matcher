// src/app/bot/route.ts
export const dynamic = "force-static";

export async function GET() {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<title>Resume ↔ JD Matcher</title>
<meta name="description" content="ATS-friendly resume tailoring — match score, missing keywords, rewrites, cover letter. Everything runs in your browser."/>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="canonical" href="https://www.jdmatcher.com/" />
</head><body><main>
<h1>Resume ↔ JD Matcher</h1>
<ul>
<li>Match score + missing keywords tailored to the JD</li>
<li>Auto-rewrites for weak bullets (action verb + metric + impact)</li>
<li>JD-specific 75-word summary and cover letter</li>
<li>Private by design — everything runs in your browser</li>
</ul>
<p>If you’re human, use the app at <a href="https://www.jdmatcher.com/">jdmatcher.com</a>.</p>
</main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
