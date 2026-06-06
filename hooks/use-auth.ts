"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-config";

/**
 * Hook that checks authentication on mount and redirects to /login if not
 * authenticated. Returns a boolean indicating whether the user is authenticated.
 *
 * Usage in any protected page:
 *   const { ready, authenticated } = useRequireAuth();
 *   if (!ready) return <LoadingSpinner />;
 *   if (!authenticated) return null; // redirecting…
 *   return <YourContent />;
 */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const authed = isAuthenticated();
    if (!authed) {
      const loginUrl = `/login${
        pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : ""
      }`;
      router.replace(loginUrl);
    } else {
      setAuthenticated(true);
    }
    setReady(true);
  }, [router, pathname]);

  return { ready, authenticated };
}
