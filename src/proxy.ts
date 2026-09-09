import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/savings/session";

/**
 * Gates the private savings section (Next 16 proxy convention). Verifies the JWT only (jose is edge-safe);
 * the password check lives in the node-runtime login route.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page and its endpoint must stay reachable while logged out.
  if (pathname === "/savings/login" || pathname === "/api/savings/login") {
    return NextResponse.next();
  }

  // Cron is machine-to-machine and authenticates with CRON_SECRET instead.
  if (pathname.startsWith("/api/savings/cron/")) {
    return NextResponse.next();
  }

  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/savings/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/savings/:path*", "/api/savings/:path*"],
};
