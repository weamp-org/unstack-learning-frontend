import { z } from "zod";

import api, { apiErrorMessage } from "./api";

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

export interface TeachingSubject {
  teacherId: string;
  subjectId: string;
  subject: Subject;
}

export async function getMyTeachingSubjects(): Promise<TeachingSubject[]> {
  const { data } = await api.get<TeachingSubject[]>("/teachers/me/subjects");
  return data;
}

export async function setMyTeachingSubjects(
  subjectIds: string[],
): Promise<TeachingSubject[]> {
  const { data } = await api.put<TeachingSubject[]>("/teachers/me/subjects", {
    subjectIds,
  });
  return data;
}

export function subjectErrorMessage(error: unknown, fallback: string): string {
  return apiErrorMessage(error, fallback, {
    409: "A subject with that name already exists.",
    403: "Only admins can do that.",
  });
}
