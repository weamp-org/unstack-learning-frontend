const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAYS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 11 → 11th, 24 → 24th. */
export function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

/**
 * `24th Oct, 2026`.
 *
 * Built by hand rather than through `Intl` because ordinals are not part of
 * any locale's date patterns — the browser would render "Oct 24, 2026" and
 * we would have to special-case the day anyway.
 *
 * Times and dates are shown in the reader's own timezone: the API sends UTC
 * and `Date` converts on read, which is what a learner in another region
 * expects when a session time is quoted.
 */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${ordinal(date.getDate())} ${MONTHS_SHORT[date.getMonth()]}, ${date.getFullYear()}`;
}

/** `3:34 PM` — 12-hour, no seconds, no locale surprises. */
export function formatTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "—";
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

/** `24th Oct, 2026, 3:34 PM`. */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/** `Sat, 24th Oct` — for rows where the year is noise. */
export function formatWeekdayDate(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${ordinal(date.getDate())} ${MONTHS_SHORT[date.getMonth()]}`;
}

/**
 * `Today, 3:34 PM` / `Tomorrow, 9:00 AM` / `24th Oct, 2026, 3:34 PM`.
 *
 * For sessions and notifications, where "when" matters more than "what date".
 * Day comparison is by local calendar date, so 11:50 PM and 12:10 AM are
 * different days even though they are twenty minutes apart.
 */
export function formatRelativeDateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "—";

  const startOfDay = (input: Date) =>
    new Date(input.getFullYear(), input.getMonth(), input.getDate()).getTime();

  const days = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / 86_400_000,
  );

  if (days === 0) return `Today, ${formatTime(date)}`;
  if (days === 1) return `Tomorrow, ${formatTime(date)}`;
  if (days === -1) return `Yesterday, ${formatTime(date)}`;
  return formatDateTime(date);
}
