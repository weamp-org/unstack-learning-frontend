"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchCurrentUser, type UserRole } from "@/lib/users";

const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "students",
  TEACHER: "teachers",
  ADMIN: "admins",
};

export function RequireRoles({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  if (meQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const isSignedOut =
    meQuery.isError &&
    isAxiosError(meQuery.error) &&
    meQuery.error.response?.status === 401;

  const allowed =
    meQuery.data !== undefined && roles.includes(meQuery.data.role);

  if (!allowed) {
    const who = roles.map((role) => ROLE_LABELS[role]).join(" or ");
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {isSignedOut ? "Sign in required" : "Restricted"}
            </CardTitle>
            <CardDescription>
              {isSignedOut
                ? "Sign in to continue."
                : `This page is only for ${who}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Go home</Link>
            </Button>
            {meQuery.isError && !isSignedOut ? (
              <Button variant="outline" onClick={() => meQuery.refetch()}>
                Try again
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
