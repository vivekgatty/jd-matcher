// src/app/page.tsx
export const dynamic = "force-dynamic"; // <-- IMPORTANT: allows headers()

import { headers } from "next/headers";
import HomeApp from "./_home-app"; // this file has "use client" at top

const BOT_UA = /(googlebot|bingbot|baiduspider|yandexbot|duckduckbot|slurp)/i;

function BotShell() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto", lineHeight: 1.6 }}>
      <h1>Resume ↔ JD Matcher</h1>
      <ul>
        <li>Match score + missing keywords tailored to the exact JD</li>
        <li>Auto-rewrites for weak bullets (action verb + metric + impact)</li>
        <li>JD-specific 75-word summary and ready-to-send cover letter</li>
        <li>Private by design — everything runs in your browser</li>
      </ul>
      <p>If you’re human, use the interactive app at <a href="https://www.jdmatcher.com/">jdmatcher.com</a>.</p>
    </main>
  );
}

export default function Page() {
  const ua = headers().get("user-agent") || "";
  return BOT_UA.test(ua) ? <BotShell /> : <HomeApp />;
}
