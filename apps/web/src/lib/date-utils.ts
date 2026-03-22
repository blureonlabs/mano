const IST = "Asia/Kolkata";

/** Get the Monday of the week containing the given date (in IST) */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  // Get the IST day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const istDay = getISTDayOfWeek(d);
  const diff = istDay === 0 ? -6 : 1 - istDay;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get start of day in IST as ISO string */
export function startOfDayIST(date: Date): string {
  const dateStr = toISTDateString(date);
  return new Date(`${dateStr}T00:00:00+05:30`).toISOString();
}

/** Get end of day in IST as ISO string */
export function endOfDayIST(date: Date): string {
  const dateStr = toISTDateString(date);
  return new Date(`${dateStr}T23:59:59.999+05:30`).toISOString();
}

/** Get end of week (Sunday 23:59:59 IST) from a Monday as ISO string */
export function endOfWeekIST(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return endOfDayIST(sunday);
}

/** Get IST hour (0-23) from a Date */
export function getISTHour(date: Date): number {
  return parseInt(
    date.toLocaleString("en-US", { timeZone: IST, hour: "numeric", hour12: false }),
    10
  );
}

/** Get IST minutes from a Date */
export function getISTMinutes(date: Date): number {
  return parseInt(
    date.toLocaleString("en-US", { timeZone: IST, minute: "numeric" }),
    10
  );
}

/** Get IST day of week (0=Sun, 6=Sat) */
function getISTDayOfWeek(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST,
    weekday: "short",
  }).formatToParts(date);
  const dayStr = parts.find((p) => p.type === "weekday")?.value ?? "";
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return dayMap[dayStr] ?? 0;
}

/** Format time in IST: "10:00 am" */
export function formatTimeIST(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  });
}

/** Format date in IST: "Wednesday, March 12" */
export function formatDateIST(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: IST,
  });
}

/** Format short date: "Wed 12" */
export function formatShortDateIST(date: Date): { dayName: string; dateNum: number; monthShort: string } {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date);

  return {
    dayName: parts.find((p) => p.type === "weekday")?.value ?? "",
    dateNum: parseInt(parts.find((p) => p.type === "day")?.value ?? "0", 10),
    monthShort: parts.find((p) => p.type === "month")?.value ?? "",
  };
}

/** Format week range: "Mar 10 – 16, 2026" */
export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monMonth = monday.toLocaleDateString("en-IN", { month: "short", timeZone: IST });
  const monDay = monday.toLocaleDateString("en-IN", { day: "numeric", timeZone: IST });
  const sunDay = sunday.toLocaleDateString("en-IN", { day: "numeric", timeZone: IST });
  const sunMonth = sunday.toLocaleDateString("en-IN", { month: "short", timeZone: IST });
  const year = sunday.toLocaleDateString("en-IN", { year: "numeric", timeZone: IST });

  if (monMonth === sunMonth) {
    return `${monMonth} ${monDay} – ${sunDay}, ${year}`;
  }
  return `${monMonth} ${monDay} – ${sunMonth} ${sunDay}, ${year}`;
}

/** Get array of 7 Date objects starting from Monday */
export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Get day column index (0=Mon, 6=Sun) for an ISO datetime relative to a week start */
export function getDayColumn(iso: string, weekStart: Date): number {
  const d = new Date(iso);
  const dayOfWeek = getISTDayOfWeek(d);
  // Convert from Sun=0..Sat=6 to Mon=0..Sun=6
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

/** Check if two dates are the same IST day */
export function isSameISTDay(a: Date, b: Date): boolean {
  return toISTDateString(a) === toISTDateString(b);
}

/** Get IST date string (YYYY-MM-DD) */
export function toISTDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: IST }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

/** Format hour label: "8 AM", "12 PM", etc. */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

/** Create an IST ISO string for a given date and hour:minute */
export function makeISTDateTime(date: Date, hours: number, minutes: number = 0): string {
  const dateStr = toISTDateString(date);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${dateStr}T${hh}:${mm}:00+05:30`).toISOString();
}

/** Get the first day of the month containing the given date (in IST) */
export function getFirstOfMonth(date: Date): Date {
  const dateStr = toISTDateString(date);
  const [year, month] = dateStr.split("-");
  return new Date(`${year}-${month}-01T00:00:00+05:30`);
}

/** Get end of month (last day 23:59:59 IST) as ISO string */
export function endOfMonthIST(date: Date): string {
  const dateStr = toISTDateString(date);
  const [yearStr, monthStr] = dateStr.split("-");
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(`${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999+05:30`).toISOString();
}

/**
 * Get 42 Date objects (6 rows x 7 cols) for a month grid.
 * Starts from the Monday of the week containing the 1st of the month.
 */
export function getMonthGrid(date: Date): Date[] {
  const first = getFirstOfMonth(date);
  const startMonday = getMonday(first);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startMonday);
    d.setDate(startMonday.getDate() + i);
    return d;
  });
}

/** Format month + year: "March 2026" */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: IST,
  }).format(date);
}

/** Get IST month (1-12) from a Date */
export function getISTMonth(date: Date): number {
  return parseInt(
    date.toLocaleString("en-US", { timeZone: IST, month: "numeric" }),
    10
  );
}
