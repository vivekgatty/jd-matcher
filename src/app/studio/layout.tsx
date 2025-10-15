// src/app/studio/layout.tsx
// Server component (no "use client")
import React from "react";
import "../globals.css";

export const metadata = {
  title: "Studio",
  description: "Marketing Studio",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    // NOTE: wrapper div, not <body>
    <div className="studio-body">
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
        <aside style={{ borderRight: "1px solid #1f2937", padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Studio</div>
          <nav style={{ display: "grid", gap: 8 }}>
            <a href="/studio/ad">Ad Generator</a>
            <a href="/studio/email">Cold Emailer</a>
            <a href="/studio/portfolio">Portfolio</a>
            <a href="/studio/templates">Template Store</a>
          </nav>
        </aside>

        <div style={{ padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
