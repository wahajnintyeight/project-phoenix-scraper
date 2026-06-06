/**
 * Frontend-only password authentication.
 *
 * The password is stored as a SHA-256 hash. When a user logs in,
 * their entered password is hashed client-side and compared to this hash.
 *
 * To generate a hash for your password, run in a browser console:
 *   crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-password"))
 *     .then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,'0')).join(''))
 *
 * Or in terminal:
 *   echo -n "your-password" | sha256sum
 *
 * Set to an empty string "" to disable password protection (allow all).
 */

/** SHA-256 hex digest of the correct password. Replace with your own hash. */
export const PASSWORD_HASH = "PLACEHOLDER_HASH";

/** Name of the cookie used to persist authentication. */
export const AUTH_COOKIE = "phoenix_auth";

/** How long the auth cookie lasts (in seconds). Default: 7 days. */
export const AUTH_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Verify a plaintext password against the stored hash.
 * Uses the Web Crypto API (available in browsers).
 */
export async function verifyPassword(password: string): Promise<boolean> {
  if (!PASSWORD_HASH) return true; // auth disabled

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex === PASSWORD_HASH;
}

/** Read a cookie value by name (client-side only). */
export function getCookie(name: string): string | undefined {
  for (const c of document.cookie.split(";")) {
    const [k, ...rest] = c.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
}

/** Check if the current visitor has a valid auth cookie (client-side only). */
export function isAuthenticated(): boolean {
  if (!PASSWORD_HASH) return true; // auth disabled
  return getCookie(AUTH_COOKIE) === PASSWORD_HASH;
}
