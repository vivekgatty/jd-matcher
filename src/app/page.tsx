// server wrapper (static HTML shell); safe for bots and humans
export const dynamic = "force-static";
export const revalidate = 60;

import HomeApp from "./_home-app";

export default function Page() {
  return (
    <>
      <HomeApp />

      {/* MOVE your long SEO <section> from _home-app.tsx to here (keep only one copy) */}

      {/* MOVE your single JSON-LD <script> here (and keep only ONE block) */}
      {/* Example:
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoObject) }}
      />
      */}
    </>
  );
}
