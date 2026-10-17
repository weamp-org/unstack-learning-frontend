import { isAxiosError } from "axios";
import { z } from "zod";

import api from "./api";

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const subjectFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be 100 characters or fewer."),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer.")
    .optional(),
});

export type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export interface UpdateSubjectInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export async function listSubjects(
  includeInactive = false,
): Promise<Subject[]> {
  const { data } = await api.get<Subject[]>("/subjects", {
    params: includeInactive ? { includeInactive: true } : {},
  });
  return data;
}

export async function createSubject(input: {
  name: string;
  description?: string;
}): Promise<Subject> {
  const { data } = await api.post<Subject>("/subjects", input);
  return data;
}

export async function updateSubject(
  id: string,
  input: UpdateSubjectInput,
): Promise<Subject> {
  const { data } = await api.patch<Subject>(`/subjects/${id}`, input);
  return data;
}

export async function deleteSubject(id: string): Promise<Subject> {
  const { data } = await api.delete<Subject>(`/subjects/${id}`);
  return data;
}

export function subjectErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) {
      return "A subject with that name already exists.";
    }
    if (error.response?.status === 403) {
      return "Only admins can do that.";
    }
    const message = error.response?.data as { message?: unknown } | undefined;
    if (typeof message?.message === "string") {
      return message.message;
    }
  }
  return fallback;
}
