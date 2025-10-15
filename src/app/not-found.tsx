// src/app/not-found.tsx
export const dynamic = "force-dynamic"; // don't pre-render this page

export default function NotFound() {
  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ margin: 0 }}>Page not found</h1>
      <p style={{ opacity: 0.8 }}>
        Sorry, we couldn’t find that page.
      </p>
      <a href="/" style={{ color: "#0ea5e9", textDecoration: "none" }}>
        ← Go to homepage
      </a>
    </main>
  );
}
