import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_UA =
  /(googlebot|bingbot|duckduckbot|baiduspider|yandexbot|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|slackbot|whatsapp|discordbot)/i;

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const url = new URL(req.url);

  // Only rewrite the homepage for known crawlers
  if (url.pathname === "/" && BOT_UA.test(ua)) {
    url.pathname = "/botshell";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Only match the homepage
export const config = { matcher: ["/"] };
