/**
 * User-Agent parsing utility for analytics
 * Extracts device type, browser, and OS from User-Agent string
 */

export interface DeviceInfo {
  device_type: "desktop" | "mobile" | "tablet";
  browser: string | null;
  os: string | null;
}

export function parseUserAgent(ua: string): DeviceInfo {
  const lowerUA = ua.toLowerCase();

  // Detect device type
  let device_type: DeviceInfo["device_type"] = "desktop";
  if (
    /ipad|tablet|playbook|silk/.test(lowerUA) ||
    (/android/.test(lowerUA) && !/mobile/.test(lowerUA))
  ) {
    device_type = "tablet";
  } else if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(lowerUA)
  ) {
    device_type = "mobile";
  }

  // Detect browser
  let browser: string | null = null;
  if (/edg\//.test(lowerUA)) browser = "Edge";
  else if (/chrome/.test(lowerUA) && !/chromium|edg/.test(lowerUA))
    browser = "Chrome";
  else if (/safari/.test(lowerUA) && !/chrome|chromium/.test(lowerUA))
    browser = "Safari";
  else if (/firefox/.test(lowerUA)) browser = "Firefox";
  else if (/opera|opr\//.test(lowerUA)) browser = "Opera";
  else if (/msie|trident/.test(lowerUA)) browser = "IE";

  // Detect OS
  let os: string | null = null;
  if (/windows/.test(lowerUA)) os = "Windows";
  else if (/macintosh|mac os x/.test(lowerUA)) os = "macOS";
  else if (/iphone|ipad|ipod/.test(lowerUA)) os = "iOS";
  else if (/android/.test(lowerUA)) os = "Android";
  else if (/linux/.test(lowerUA)) os = "Linux";

  return { device_type, browser, os };
}
