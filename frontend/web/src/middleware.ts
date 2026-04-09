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
  const isProtectedRoleRoute =
    pathname.startsWith("/user") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/builder");
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
    role = payload.roleName; // user | agent | builder
  } catch {
    return new NextResponse(null, { status: 403 });
  }

  // 3. Role rules
  if (pathname.startsWith("/agent") && role !== "agent") {
     return new NextResponse(null, { status: 403 });
  }

  if (pathname.startsWith("/builder") && role !== "builder") {
     return new NextResponse(null, { status: 403 });
  }

  if (pathname.startsWith("/user") && role !== "user") {
      return new NextResponse(null, { status: 403 });
  }

  if (isUserOnlyRoute && role !== "user") {
    return new NextResponse(null, { status: 403 });
  }

  if (isBuilderRestrictedRoute && role === "builder") {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user/:path*",
    "/agent/:path*",
    "/builder/:path*",
    "/settings/:path*",
    "/my-properties/:path*",
    "/shortlisted-properties/:path*",
    "/contacted-properties/:path*",
    "/membership/:path*",
    "/postproperty/:path*",
  ],
};
