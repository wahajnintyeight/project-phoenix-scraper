import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { IP_WHITELIST, isIpAllowed } from "./lib/ip-config";

const isDev = process.env.NODE_ENV === "development";
const SESSION_API = "https://api.theprojectphoenix.top/v2/api/createSession";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

async function recordBlockedVisit(request: NextRequest) {
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
  const ip = getClientIp(request);

  if (!isIpAllowed(ip, isDev)) {
    // still record the visit so admin can see the blocked browser/UA
    await recordBlockedVisit(request);

    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied</title>
</head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#f4f4f4;font-family:system-ui,sans-serif">
  <div style="text-align:center;padding:2rem;border:1px solid #333;border-radius:8px;background:#111;max-width:420px">
    <h1 style="font-size:1.5rem;margin:0 0 0.5rem;color:#ef4444">403 — Access Denied</h1>
    <p style="color:#888;margin:0">Your IP is not authorized to access this resource.</p>
  </div>
</body>
</html>`,
      {
        status: 403,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
