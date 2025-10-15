// src/middleware.ts
import { NextResponse } from 'next/server';

export const config = {
  // run on the homepage only; add more routes if you need
  matcher: ['/'],
};

export function middleware(req: Request) {
  const ua = req.headers.get('user-agent')?.toLowerCase() || '';
  // catch Googlebot + the Search Console live tester (Inspection Tool)
  const isBot = /(googlebot|google-inspection tool|bingbot|duckduckbot|slurp|yandex)/i.test(ua);
  if (isBot) {
    return NextResponse.rewrite(new URL('/bot.html', req.url));
  }
  return NextResponse.next();
}

