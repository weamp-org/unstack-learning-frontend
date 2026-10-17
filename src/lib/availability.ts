import { isAxiosError } from "axios";
import { z } from "zod";

import api from "./api";

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

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilityFormSchema = z
  .object({
    weekday: z.coerce.number().min(0).max(6),
    startTime: z.string().regex(timePattern, "Start must be HH:MM (24-hour)."),
    endTime: z.string().regex(timePattern, "End must be HH:MM (24-hour)."),
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

export function availabilityErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) {
      return "That overlaps an existing window.";
    }
    const message = error.response?.data as { message?: unknown } | undefined;
    if (typeof message?.message === "string") {
      return message.message;
    }
  }
  return fallback;
}
