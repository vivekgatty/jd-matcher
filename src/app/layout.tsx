// src/app/layout.tsx
export const dynamic = "force-static";
export const revalidate = false;
export const fetchCache = 'force-cache';
import type { Metadata } from "next";
import Script from "next/script";
import * as React from "react";
import "./globals.css";

/** --- Site-wide SEO metadata (kept minimal & type-safe) --- */
export const metadata: Metadata = {
  metadataBase: new URL("https://www.jdmatcher.com"),
  alternates: { canonical: "/" },
  title: {
    default: "JD Matcher – Tailor Your Resume to Any Job (ATS-friendly)",
    template: "%s | JD Matcher",
  },
  description:
    "Paste a job description and your resume to get an ATS-friendly match score, tailored bullets, cover letters, interview Qs, and more. Runs fully in your browser.",
  openGraph: {
    type: "website",
    url: "https://www.jdmatcher.com/",
    siteName: "JD Matcher",
    title: "JD Matcher – Tailor Your Resume to Any Job (ATS-friendly)",
    description:
      "ATS-friendly resume tailoring, match score, tailored bullets & cover letters—no sign-up required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "JD Matcher – Tailor Your Resume to Any Job",
    description:
      "Get a match score and instant tailored edits for any JD. ATS-friendly & fast.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* —— Google Analytics (GA4) —— */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = window.gtag || gtag;
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
        {/* —— /GA4 —— */}
      </head>
      <body>
        {/* Tracks SPA route changes */}
        {GA_ID && <AnalyticsPageViews />}
        {children}
      </body>
    </html>
  );
}

/**
 * Client-only micro component that sends GA4 page_view
 * whenever the route (or query) changes.
 * Keeping it inline avoids another file.
 */
function AnalyticsPageViews() {
  "use client";
  const { usePathname, useSearchParams } = require("next/navigation");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const qp = searchParams?.toString();
    const url = qp ? `${pathname}?${qp}` : pathname;
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "page_view", { page_path: url });
    }
  }, [pathname, searchParams]);

  return null;
}
