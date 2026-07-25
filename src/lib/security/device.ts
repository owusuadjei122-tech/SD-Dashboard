import { createHash } from "crypto";

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  label: string;
}

const BROWSERS: Array<[RegExp, string]> = [
  [/edg[ea]?\//i, "Edge"],
  [/opr\/|opera/i, "Opera"],
  [/chrome\/|crios\//i, "Chrome"],
  [/firefox\/|fxios\//i, "Firefox"],
  [/safari\//i, "Safari"],
];

const OPERATING_SYSTEMS: Array<[RegExp, string]> = [
  [/iphone|ipad|ipod/i, "iOS"],
  [/android/i, "Android"],
  [/mac os x|macintosh/i, "macOS"],
  [/windows nt/i, "Windows"],
  [/cros/i, "ChromeOS"],
  [/linux/i, "Linux"],
];

export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo {
  const ua = userAgent || "";

  const browser = BROWSERS.find(([pattern]) => pattern.test(ua))?.[1] ?? "Unknown browser";
  const os = OPERATING_SYSTEMS.find(([pattern]) => pattern.test(ua))?.[1] ?? "Unknown OS";

  let device = "Desktop";
  if (/ipad|tablet/i.test(ua)) device = "Tablet";
  else if (/mobi|iphone|android.*mobile/i.test(ua)) device = "Mobile";

  return { browser, os, device, label: `${browser} on ${os}` };
}

/**
 * Stable per-device identifier. Deliberately excludes the IP so that a laptop
 * moving between networks is still recognised as the same device.
 */
export function deviceFingerprint(userAgent: string | null | undefined): string {
  const { browser, os, device } = parseUserAgent(userAgent);
  return createHash("sha256").update(`${browser}|${os}|${device}`).digest("hex").slice(0, 32);
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || null;
}
