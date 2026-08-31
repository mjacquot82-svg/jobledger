import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!sessionCookie && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/customers/:path*",
    "/settings/:path*",
    "/login",
  ],
};
