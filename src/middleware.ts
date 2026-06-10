import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-browser anonymous identity.
 *
 * Each visitor gets a stable, httpOnly `pm_uid` cookie on first request.
 * The same id is forwarded to route handlers this round-trip via the
 * `x-pm-uid` request header, so even the very first request resolves to a
 * consistent user. All project data is scoped to this id — every browser is
 * its own private workspace, with no login. This can be upgraded to real
 * accounts later (the schema already carries clerkUserId).
 */
export function middleware(request: NextRequest) {
  const existing = request.cookies.get("pm_uid")?.value;
  const uid = existing ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pm-uid", uid);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!existing) {
    response.cookies.set("pm_uid", uid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
