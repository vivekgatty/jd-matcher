// src/app/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { Suspense } from "react";
import HomeApp from "./_home-app"; // 'use client' inside

const BOT_UA = /(googlebot|bingbot|baiduspider|yandexbot|duckduckbot|slurp)/i;

function BotShell() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Resume ↔ JD Matcher</h1>
      <p>
        ATS-friendly resume optimizer that matches your resume to job descriptions and
        generates bullets, a concise summary, and a cover letter — runs fully in your browser.
      </p>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <a href="/studio">Studio →</a>
        <a href="/studio/ad">Ad Headline Generator →</a>
        <a href="/studio/email">Cold Emailer →</a>
        <a href="/studio/portfolio">Portfolio Builder →</a>
        <a href="/studio/templates">AI Template Store →</a>
      </nav>
    </main>
  );
}

export default async function Page() {
  const maybe = headers() as any;
  const h = typeof maybe?.then === "function" ? await maybe : maybe;
  const ua = h?.get?.("user-agent") ?? "";
  const isBot = BOT_UA.test(ua);

  return (
    <Suspense fallback={<main style={{ padding: 24 }}><h1>Loading…</h1></main>}>
      {isBot ? <BotShell /> : <HomeApp />}
    </Suspense>
  );
}
