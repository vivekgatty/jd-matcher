// src/app/page.tsx (server component wrapper)
export const dynamic = "force-static";

import type { Metadata } from "next";
import dynamic from "next/dynamic";  // ⬅️ rename, not `dynamic`

const HomeApp = nextdynamic(() => import("./_home-app"), { ssr: false });

export const metadata: Metadata = {
  title: "Resume ↔ JD Matcher",
  description:
    "ATS-friendly, JD-specific resume tailoring. Private by design — everything runs in your browser."
};

export default function Page() {
  return <HomeApp />;
}
