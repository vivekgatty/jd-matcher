"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p style={{ opacity: 0.8 }}>{error.message}</p>
      <button onClick={reset} style={{ padding: "6px 10px" }}>Try again</button>
    </main>
  );
}
