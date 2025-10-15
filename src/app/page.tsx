// src/app/page.tsx (server component wrapper)
export const dynamic = "force-static";

import dynamic from "next/dynamic";

// load the heavy UI entirely on the client
const HomeApp = dynamic(() => import("./_home-app"), {
  ssr: false,
  loading: () => (
    <main style={{ padding: 24 }}>
      <h1>Loading…</h1>
    </main>
  ),
});

export default function Page() {
  // just render the client app
  return <HomeApp />;
}
