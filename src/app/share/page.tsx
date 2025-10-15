// src/app/share/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0; // explicit: no caching at build time
import React from "react";

// Optional: good default SEO for the public scorecard page
export const metadata = {
  title: "JD ↔ Resume Scorecard | Share View",
  description:
    "Public, read-only scorecard page for a JD ↔ Resume match. Share your score, prioritized keywords, and improvement plan.",
};

// In Next.js 15, `searchParams` for Server Components is a Promise.
// We type it accordingly and await it inside the (async) page.
type SP = Record<string, string | string[] | undefined>;

function pickString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function safeJSON<T = any>(s?: string | null): T | null {
  try {
    if (!s) return null;
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  // Expect a base64/URI encoded JSON payload in ?d=...
  const rawD = pickString(sp?.d);
  const decoded =
    rawD && (rawD.includes("%") ? decodeURIComponent(rawD) : rawD);
  const data = safeJSON<any>(decoded);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Shared Scorecard</h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        Read-only view of a JD ↔ Resume match.
      </p>

      {!data ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff8f1",
          }}
        >
          <strong>Nothing to show.</strong> The link is missing data or has an
          invalid format.
        </div>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Overview */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <h3 style={{ margin: "6px 0 10px 0" }}>Overview</h3>
            <div style={{ lineHeight: 1.6 }}>
              <div>
                <strong>Match Score:</strong> {data.score ?? "—"}
              </div>
              <div>
                <strong>Target:</strong> {data.target ?? "—"}
              </div>
              {typeof data.predicted === "number" && (
                <div>
                  <strong>Predicted after fixes:</strong> {data.predicted}
                </div>
              )}
            </div>
          </div>

          {/* Prioritized keywords */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <h3 style={{ margin: "6px 0 10px 0" }}>Prioritized Keywords</h3>
            {Array.isArray(data.prioritized) && data.prioritized.length ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.prioritized.slice(0, 30).map((k: string, i: number) => (
                  <li key={i} style={{ margin: "4px 0" }}>
                    {k}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ opacity: 0.7 }}>No keywords provided.</div>
            )}
          </div>

          {/* Improved summary */}
          {data.improvedSummary ? (
            <div
              style={{
                gridColumn: "1 / -1",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <h3 style={{ margin: "6px 0 10px 0" }}>Improved Summary</h3>
              <div style={{ whiteSpace: "pre-wrap" }}>{data.improvedSummary}</div>
            </div>
          ) : null}

          {/* Suggested bullets */}
          {Array.isArray(data.bullets) && data.bullets.length ? (
            <div
              style={{
                gridColumn: "1 / -1",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <h3 style={{ margin: "6px 0 10px 0" }}>Suggested Bullets</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {data.bullets.slice(0, 20).map((b: string, i: number) => (
                  <li key={i} style={{ margin: "5px 0" }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
