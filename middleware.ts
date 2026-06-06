import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_API = "https://api.theprojectphoenix.top/v2/api/createSession";

async function recordVisit(request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent") || "";
    await fetch(SESSION_API, {
      method: "PUT",
      headers: {
        "project-type": "phoenix-scraper",
        "user-agent": ua,
      },
    });
  } catch {
    // silently fail — session recording is best-effort
  }
}

export async function middleware(request: NextRequest) {
  // Record every visit for analytics (no blocking — auth is client-side only)
  await recordVisit(request);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
