// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "JD Matcher",
  description: "ATS-friendly resume ↔ JD matcher",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
