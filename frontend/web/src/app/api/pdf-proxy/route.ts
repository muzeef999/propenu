import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function resolvePdfUrl(sourceUrl: string, request: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  if (/^https?:\/\//i.test(sourceUrl)) {
    return new URL(sourceUrl);
  }

  if (sourceUrl.startsWith("//")) {
    return new URL(`${request.nextUrl.protocol}${sourceUrl}`);
  }

  if (sourceUrl.startsWith("/") && apiBase) {
    return new URL(sourceUrl, apiBase);
  }

  return new URL(sourceUrl, request.nextUrl.origin);
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("url");

  if (!sourceUrl) {
    return NextResponse.json(
      { message: "Missing PDF URL." },
      { status: 400 }
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = resolvePdfUrl(sourceUrl, request);
  } catch {
    return NextResponse.json(
      { message: "Invalid PDF URL." },
      { status: 400 }
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json(
      { message: "Unsupported PDF URL." },
      { status: 400 }
    );
  }

  const response = await fetch(parsedUrl.toString(), {
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { message: "Unable to load PDF." },
      { status: response.status || 502 }
    );
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": "inline",
      "Content-Type":
        response.headers.get("content-type") || "application/pdf",
    },
  });
}
