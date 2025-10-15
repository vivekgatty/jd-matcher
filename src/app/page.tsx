// src/app/page.tsx
export const dynamic = "force-static"; // ok here (server file)
// export const revalidate = 60;        // optional, if you want ISR

import NextDynamic from "next/dynamic";   // ⬅️ rename

const HomeApp = NextDynamic(() => import("./_home-app"), {
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
