// server component wrapper (static HTML shell only)
export const dynamic = "force-static";
export const revalidate = 60;

import HomeApp from "./_home-app"; // <-- import the client component directly

export default function Page() {
  return <HomeApp />;
}
