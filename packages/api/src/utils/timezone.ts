/**
 * Get the UTC offset string (e.g., "+05:30") for an IANA timezone at a given date.
 * Uses the Intl API — no external dependencies required.
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    // tzPart.value is like "GMT+5:30" or "GMT-8" or "GMT"
    const match = tzPart?.value?.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
    if (!match) {
      // "GMT" with no offset means UTC
      if (tzPart?.value === "GMT") return "+00:00";
      return "+05:30"; // fallback to IST
    }
    const rawOffset = match[1] ?? "+05:30";
    // Normalize: "+5:30" → "+05:30", "-8" → "-08:00"
    const parts2 = rawOffset.split(":");
    const hoursPart = parts2[0] ?? "+0";
    const minsPart = parts2[1] ?? "00";
    const sign = hoursPart.startsWith("-") ? "-" : "+";
    const h = Math.abs(parseInt(hoursPart)).toString().padStart(2, "0");
    return `${sign}${h}:${minsPart.padStart(2, "0")}`;
  } catch {
    // Invalid timezone string — fall back to IST
    return "+05:30";
  }
}
