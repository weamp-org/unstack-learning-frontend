import { isAxiosError } from "axios";
import { z } from "zod";

import api from "./api";
import type { Subject } from "./subjects";

export interface HelpLink {
  id: string;
  requestId: string;
  url: string;
}

export interface HelpRequest {
  id: string;
  learnerId: string;
  subjectId: string;
  topic: string;
  details: string | null;
  status: HelpRequestStatus;
  teacherId: string | null;
  createdAt: string;
  updatedAt: string;
  subject: Subject;
  links: HelpLink[];
  learner?: { id: string; name: string };
  teacher?: { id: string; name: string } | null;
  session?: HelpSession | null;
}

export type HelpRequestStatus = "OPEN" | "ACCEPTED" | "CLOSED";

export interface HelpSession {
  id: string;
  requestId: string;
  sessionUrl: string | null;
  scheduledAt: string | null;
  source: "MANUAL" | "GOOGLE";
  createdAt: string;
  updatedAt: string;
}

const linkSchema = z.object({
  url: z.string().url("Enter a valid URL.").max(2048, "URL is too long."),
});

export const helpRequestFormSchema = z
  .object({
    subjectId: z.string().min(1, "Choose a subject."),
    topic: z
      .string()
      .min(1, "Give your request a topic.")
      .max(120, "Topic must be 120 characters or fewer."),
    details: z
      .string()
      .max(5000, "Details must be 5000 characters or fewer.")
      .optional(),
    links: z.array(linkSchema).max(3, "At most 3 links."),
  })
  .refine(
    (values) => values.details?.trim() || values.links.length > 0,
    "Add details or at least one link.",
  );

export type HelpRequestFormValues = z.infer<typeof helpRequestFormSchema>;

export interface CreateHelpRequestInput {
  subjectId: string;
  topic: string;
  details?: string;
  links?: { url: string }[];
}

export async function createHelpRequest(
  input: CreateHelpRequestInput,
): Promise<HelpRequest> {
  const { data } = await api.post<HelpRequest>("/requests", input);
  return data;
}

export async function listMyHelpRequests(): Promise<HelpRequest[]> {
  const { data } = await api.get<HelpRequest[]>("/requests/me");
  return data;
}

export async function getHelpRequest(id: string): Promise<HelpRequest> {
  const { data } = await api.get<HelpRequest>(`/requests/${id}`);
  return data;
}

export async function listRequestQueue(): Promise<HelpRequest[]> {
  const { data } = await api.get<HelpRequest[]>("/requests/queue");
  return data;
}

export async function acceptHelpRequest(
  id: string,
  input?: { sessionUrl?: string; scheduledAt?: string },
): Promise<HelpRequest> {
  const { data } = await api.patch<HelpRequest>(
    `/requests/${id}/accept`,
    input ?? {},
  );
  return data;
}

export async function declineHelpRequest(
  id: string,
): Promise<{ id: string; declined: boolean }> {
  const { data } = await api.patch<{ id: string; declined: boolean }>(
    `/requests/${id}/decline`,
  );
  return data;
}

export async function closeHelpRequest(id: string): Promise<HelpRequest> {
  const { data } = await api.patch<HelpRequest>(`/requests/${id}/close`);
  return data;
}

export async function updateHelpSession(
  id: string,
  input: { sessionUrl?: string; scheduledAt?: string },
): Promise<HelpRequest> {
  const { data } = await api.patch<HelpRequest>(
    `/requests/${id}/session`,
    input,
  );
  return data;
}

/** Default prep buffer between accepting and meeting, in minutes. */
export const SESSION_LEAD_MINUTES = 15;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Format a Date as a browser-local datetime-local input value. */
export function toDateTimeLocal(value: Date): string {
  return (
    `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
    `T${pad(value.getHours())}:${pad(value.getMinutes())}`
  );
}

/** Prefill for the session time: now plus the prep buffer. */
export function defaultSessionTime(from = new Date()): string {
  return toDateTimeLocal(
    new Date(from.getTime() + SESSION_LEAD_MINUTES * 60_000),
  );
}

export function requestErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data as { message?: unknown } | undefined;
    if (typeof message?.message === "string") {
      return message.message;
    }
  }
  return fallback;
}
