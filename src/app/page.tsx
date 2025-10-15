// src/app/page.tsx
export const dynamic = "force-dynamic";

import HomeApp from "./_home-app"; // _home-app has "use client" at top

export default function Page() {
  return <HomeApp />;
}
