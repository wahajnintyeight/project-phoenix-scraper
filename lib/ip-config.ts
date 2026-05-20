/**
 * IP Whitelist patterns — only visitors matching these IPs are allowed.
 * Supports wildcards: "119.63.*.*" matches any IP in 119.63.x.x range.
 *
 * To disable the guard, set to an empty array: []
 */
export const IP_WHITELIST: string[] = [
  "119.63.*.*",
  "149.71.36.*",
  "154.57.*.*"
  // Add more patterns below:
  // "203.0.113.5",
  // "10.0.0.*",
];

const DEV_IPS = new Set(["::1", "127.0.0.1"]);

export function matchIpPattern(ip: string, pattern: string): boolean {
  const ipParts = ip.split(".");
  const patternParts = pattern.split(".");

  if (ipParts.length !== 4 || patternParts.length !== 4) return false;

  for (let i = 0; i < 4; i++) {
    if (patternParts[i] === "*") continue;
    if (ipParts[i] !== patternParts[i]) return false;
  }
  return true;
}

export function isIpAllowed(ip: string, isDev: boolean): boolean {
  if (isDev && DEV_IPS.has(ip)) return true;
  if (IP_WHITELIST.length === 0) return true;
  return IP_WHITELIST.some((pattern) => matchIpPattern(ip, pattern));
}
