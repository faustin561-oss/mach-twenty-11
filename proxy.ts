import { NextRequest, NextResponse } from "next/server";

// proxy.ts — Next.js 16 renamed middleware.ts to proxy.ts; the old
// filename is silently ignored (no error, it just stops running), which is
// exactly what had happened here. This also switches to the pattern the
// Next.js 16 ecosystem now recommends: a "thin proxy" that only checks for
// the *existence* of a session cookie and redirects optimistically. It
// does NOT call next-auth's auth() or verify the JWT here — that
// verification happens authoritatively in each protected Server Component
// via `await auth()` (see src/app/dashboard/page.tsx and siblings), which
// is also where the actual role checks live. Two reasons for this split:
//   1. It was the direct cause of the reported crash: auth() internally
//      reads headers()/cookies(), which Next.js 16 made fully async: any
//      next-auth version that reads them synchronously throws exactly
//      "headers.get is not a function" (the Promise itself has no .get).
//      Fixed at the source by bumping to next-auth@^5.0.0-beta.31, the
//      first published beta whose peer-deps list next@^16.0.0 — but
//      keeping cheap/no session-decoding logic in the proxy is now the
//      documented-safe pattern regardless of that fix landing cleanly.
//   2. Proxy runs before Node-only APIs are guaranteed available in every
//      deployment target; a cookie-presence check needs none of that.
//
// Because this is optimistic (cookie present ≠ valid session), every
// protected page still authoritatively re-checks `await auth()` and
// redirects itself if the session doesn't actually verify. That
// server-component check is the real access control; this file only
// avoids an unnecessary render for the common "definitely logged out" case.

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/carrier", "/shipments", "/ship", "/profile", "/messages", "/notifications", "/billing"];
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

export default function proxy(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/carrier/:path*", "/shipments/:path*", "/ship/:path*", "/profile/:path*", "/messages/:path*", "/notifications/:path*", "/billing/:path*"],
};
