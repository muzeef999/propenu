import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read JWT from cookies
  const token = req.cookies.get("token")?.value;

  /* ---------------- NO TOKEN ---------------- */
  if (!token) {
    if (pathname.startsWith("/agent") || pathname.startsWith("/builder")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  /* ---------------- TOKEN EXISTS ---------------- */
  try {
    // Decode JWT payload (NO verification here)
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64").toString("utf-8")
    );

    const role = payload.roleName; // "agent" | "builder"

    /* -------- ROOT REDIRECT LOGIC -------- */
    if (pathname === "/") {
      if (role === "agent") {
        return NextResponse.redirect(new URL("/agent", req.url));
      }
      if (role === "builder") {
        return NextResponse.redirect(new URL("/builder", req.url));
      }
    }

    /* -------- ROLE PROTECTION -------- */
    if (pathname.startsWith("/agent") && role !== "agent") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/builder") && role !== "builder") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (error) {
    console.error("Invalid token:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

/* -------- MATCHER -------- */
export const config = {
  matcher: ["/", "/agent/:path*", "/builder/:path*"],
};
