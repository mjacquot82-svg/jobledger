import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!sessionCookie && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Cookie presence does not prove that its database session is still valid.
  // Always allow /login so stale cookies cannot loop with requireSession().
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/jobs",
    "/jobs/:path*",
    "/invoices",
    "/invoices/:path*",
    "/customers",
    "/customers/:path*",
    "/bills",
    "/bills/:path*",
    "/reports",
    "/reports/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
  ],
};
