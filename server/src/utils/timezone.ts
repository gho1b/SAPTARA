/**
 * Timezone utility for WIB (Asia/Jakarta, UTC+7).
 *
 * All date/time operations in SAPTARA should use these helpers
 * to ensure consistent WIB timezone across the application,
 * regardless of the server's system timezone.
 */

const TZ = "Asia/Jakarta";

/**
 * Get today's date string in WIB as "YYYY-MM-DD".
 */
export function getWIBDate(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
}

/**
 * Get current time string in WIB as "HH:MM".
 */
export function getWIBTime(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get both date and time in WIB.
 */
export function getWIBDateTime(): { date: string; time: string } {
  return { date: getWIBDate(), time: getWIBTime() };
}

/**
 * Get a date string N days ago in WIB as "YYYY-MM-DD".
 */
export function getWIBDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("sv-SE", { timeZone: TZ });
}

/**
 * Get the day-of-week index for N days ago in WIB.
 * Returns 0=Monday, 6=Sunday (ISO week style).
 */
export function getWIBDayIndex(daysAgo: number): number {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  // Get the day name in WIB timezone, then map to index
  const dayName = d.toLocaleDateString("en-US", { timeZone: TZ, weekday: "short" });
  const map: Record<string, number> = {
    Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
  };
  return map[dayName] ?? 0;
}
