// src/app/health/route.ts
export const dynamic = "force-static";
export function GET() {
  return new Response("ok", { headers: { "content-type": "text/plain" } });
}
