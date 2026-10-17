"use client";

import { RequireRoles } from "@/components/require-roles";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RequireRoles roles={["ADMIN"]}>{children}</RequireRoles>;
}
