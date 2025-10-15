// server component wrapper (no client-only code here)
export const dynamic = "force-static";
export const revalidate = 60;

import NextDynamic from "next/dynamic";   // <-- NOT "dynamic"

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
