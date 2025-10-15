// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

const SITE_NAME = "Resume ↔ JD Matcher";
const SITE_DESC =
  "ATS-friendly Resume ↔ JD Matcher. Tailor your resume to any JD, get keyword coverage, STAR bullets, cover letters and more — all in the browser.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  robots: {
    index: true,
    follow: true,
    // NOTE: keys are hyphenated in the type definition
    googleBot: {
      index: true,
      follow: true,
      ["max-snippet"]: -1,
      ["max-image-preview"]: "large",
    },
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESC,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0b0f19", color: "#e5e7eb" }}>
        {children}
      </body>
    </html>
  );
}
