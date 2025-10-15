export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h1>404 — Page not found</h1>
      <p>
        That page doesn’t exist. <a href="/">Go back home</a>.
      </p>
    </div>
  );
}
