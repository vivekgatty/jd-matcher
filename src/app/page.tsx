// src/app/page.tsx
"use client";

import dynamic from "next/dynamic";

// Load the heavy UI only on the client (no SSR at all)
const HomeApp = dynamic(() => import("./_home-app"), {
  ssr: false,
  loading: () => (
    <main style={{ padding: 24 }}>
      <h1>Loading…</h1>
    </main>
  ),
});

export default function Page() {
  return <HomeApp />;
}
