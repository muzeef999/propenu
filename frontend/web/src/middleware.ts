// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  // 1. Not logged in → block protected routes
  if (!token && (pathname.startsWith("/user") || pathname.startsWith("/agent") || pathname.startsWith("/builder"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!token) return NextResponse.next();

  // 2. Decode token
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );

  const role = payload.roleName; // user | agent | builder

  // 3. Role rules
  if (pathname.startsWith("/agent") && role !== "agent") {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  if (pathname.startsWith("/builder") && role !== "builder") {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  if (pathname.startsWith("/user") && role !== "user") {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/agent/:path*", "/builder/:path*"],
};
