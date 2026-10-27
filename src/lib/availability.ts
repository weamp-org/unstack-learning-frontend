import { z } from "zod";

import api, { apiErrorMessage } from "./api";

export interface AvailabilityWindow {
  id: string;
  teacherId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const availabilityFormSchema = z
  .object({
    weekday: z.coerce.number().min(0).max(6),
    startTime: z.string().regex(TIME_PATTERN, "Start must be HH:MM (24-hour)."),
    endTime: z.string().regex(TIME_PATTERN, "End must be HH:MM (24-hour)."),
  })
  .refine((values) => values.endTime > values.startTime, {
    message: "End must be after start (overnight windows aren't supported).",
    path: ["endTime"],
  });

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

export async function listMyAvailability(): Promise<AvailabilityWindow[]> {
  const { data } = await api.get<AvailabilityWindow[]>(
    "/teachers/me/availability",
  );
  return data;
}

export async function createAvailability(input: {
  weekday: number;
  startTime: string;
  endTime: string;
  timezone?: string;
}): Promise<AvailabilityWindow> {
  const { data } = await api.post<AvailabilityWindow>(
    "/teachers/me/availability",
    {
      ...input,
      timezone:
        input.timezone?.trim() === "" || input.timezone === undefined
          ? undefined
          : input.timezone.trim(),
    },
  );
  return data;
}

export async function deleteAvailability(
  id: string,
): Promise<AvailabilityWindow> {
  const { data } = await api.delete<AvailabilityWindow>(
    `/teachers/me/availability/${id}`,
  );
  return data;
}

export type AvailabilityOverrideKind = "AVAILABLE" | "UNAVAILABLE";

export interface AvailabilityOverride {
  id: string;
  teacherId: string;
  /** Calendar date the exception applies to, YYYY-MM-DD. */
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  kind: AvailabilityOverrideKind;
}

export async function listMyOverrides(): Promise<AvailabilityOverride[]> {
  const { data } = await api.get<AvailabilityOverride[]>(
    "/teachers/me/overrides",
  );
  return data;
}

export async function createOverride(input: {
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  kind: AvailabilityOverrideKind;
}): Promise<AvailabilityOverride> {
  const { data } = await api.post<AvailabilityOverride>(
    "/teachers/me/overrides",
    {
      ...input,
      timezone:
        input.timezone?.trim() === "" || input.timezone === undefined
          ? undefined
          : input.timezone.trim(),
    },
  );
  return data;
}

export async function deleteOverride(
  id: string,
): Promise<AvailabilityOverride> {
  const { data } = await api.delete<AvailabilityOverride>(
    `/teachers/me/overrides/${id}`,
  );
  return data;
}

export function overrideErrorMessage(error: unknown, fallback: string): string {
  return apiErrorMessage(error, fallback, {
    409: "That overlaps an existing exception.",
  });
}

export function availabilityErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return apiErrorMessage(error, fallback, {
    409: "That overlaps an existing window.",
  });
}

/** Minutes between two HH:MM times, or null when invalid or not positive. */
export function minutesBetween(start: string, end: string): number | null {
  const toMinutes = (time: string): number | null => {
    const match = TIME_PATTERN.exec(time);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null || to <= from) return null;
  return to - from;
}

/** Compact duration label: "45m", "2h", "1h 30m". */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
