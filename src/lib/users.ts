import api, { apiErrorMessage } from "./api";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export const USER_ROLES: UserRole[] = ["STUDENT", "TEACHER", "ADMIN"];

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCurrentUser(): Promise<ManagedUser> {
  const { data } = await api.get<ManagedUser>("/users/me");
  return data;
}

export async function listUsers(params?: {
  q?: string;
  role?: UserRole;
}): Promise<ManagedUser[]> {
  const { data } = await api.get<ManagedUser[]>("/users", { params });
  return data;
}

export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<ManagedUser> {
  const { data } = await api.patch<ManagedUser>(`/users/${id}/role`, {
    role,
  });
  return data;
}

export function userErrorMessage(error: unknown, fallback: string): string {
  return apiErrorMessage(error, fallback, { 403: "Only admins can do that." });
}
