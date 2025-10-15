// src/app/page.tsx (server component wrapper)
export const dynamic = "force-static";     // ok to keep here
export const revalidate = 60;              // optional

import NextDynamic from "next/dynamic";    // <-- renamed

// load the heavy UI entirely on the client
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
