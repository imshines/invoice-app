import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("user_session");
  const hasSession = !!(sessionCookie && sessionCookie.value);

  // If logged in and visiting /login, redirect to /generatebill
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/generatebill", request.url));
  }

  // Protected application routes
  const protectedRoutes = [
    "/",
    "/generatebill",
    "/stock",
    "/customer",
    "/invoices",
    "/company",
    "/users",
  ];

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, icons
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
