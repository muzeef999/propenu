import { NextRequest, NextResponse } from "next/server";

const userOnlyRoutes = [
  "/settings",
  "/my-properties",
  "/shortlisted-properties",
  "/contacted-properties",
  "/membership",
];
const builderRestrictedRoutes = ["/postproperty"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  // Public builder invite / onboard links (email CTA) — no login required
  const isPublicBuilderInviteRoute =
    pathname.startsWith("/builder/invite") ||
    pathname.startsWith("/builder/onboard");
  if (isPublicBuilderInviteRoute) {
    return NextResponse.next();
  }

  const isProtectedRoleRoute =
    pathname.startsWith("/user") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/builder") ||
    pathname.startsWith("/admin");
  const isUserOnlyRoute = userOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isBuilderRestrictedRoute = builderRestrictedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // 1. Not logged in → block protected routes
  if (!token && (isProtectedRoleRoute || isUserOnlyRoute)) {
    return new NextResponse(null, { status: 403 });
  }

  if (!token) return NextResponse.next();

  let role: string | undefined;

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    role = payload.roleName; // user | agent | builder | customer_care | relationship_manager
  } catch {
    return new NextResponse(null, { status: 403 });
  }

  // 3. Role rules
  if (
    pathname.startsWith("/agent") &&
    role !== "agent" &&
    role !== "customer_care" &&
    role !== "relationship_manager"
  ) {
     return new NextResponse(null, { status: 403 });
  }

  if (
    pathname.startsWith("/builder") &&
    role !== "builder" &&
    role !== "builder_staff"
  ) {
     return new NextResponse(null, { status: 403 });
  }

  if (pathname.startsWith("/user") && role !== "user") {
      return new NextResponse(null, { status: 403 });
  }

  if (
    pathname.startsWith("/admin") &&
    role !== "admin" &&
    role !== "super_admin" &&
    role !== "regional_manager"
  ) {
      return new NextResponse(null, { status: 403 });
  }

  if (isUserOnlyRoute && role !== "user") {
    return new NextResponse(null, { status: 403 });
  }

  if (isBuilderRestrictedRoute && (role === "builder" || role === "builder_staff")) {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user/:path*",
    "/agent/:path*",
    "/builder/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/my-properties/:path*",
    "/shortlisted-properties/:path*",
    "/contacted-properties/:path*",
    "/membership/:path*",
    "/postproperty/:path*",
  ],
};
