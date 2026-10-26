"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatRelativeDateTime } from "@/lib/datetime";
import { listMyHelpRequests } from "@/lib/requests";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Awaiting review",
  ACCEPTED: "Accepted",
  CLOSED: "Closed",
};

export default function MyHelpRequestsPage() {
  return (
    <RequireRoles roles={["STUDENT", "TEACHER", "ADMIN"]}>
      <MyRequests />
    </RequireRoles>
  );
}

function MyRequests() {
  const requestsQuery = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: listMyHelpRequests,
    retry: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My requests</h1>
        <Button asChild>
          <Link href="/requests/new">New request</Link>
        </Button>
      </div>

      {requestsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : requestsQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load requests.
          </p>
          <Button variant="outline" onClick={() => requestsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : requestsQuery.data.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            No requests yet. Ask for help when you&apos;re stuck — a teacher
            will review it and share a meeting link.
          </p>
          <Button asChild>
            <Link href="/requests/new">Request help</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {requestsQuery.data.map((item) => (
            <li key={item.id}>
              <Link href={`/requests/${item.id}`}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{item.topic}</CardTitle>
                      <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </div>
                    <CardDescription>
                      {item.subject.name} · {formatDate(item.createdAt)}
                      {item.status === "ACCEPTED"
                        ? ` · Accepted${item.teacher?.name ? ` by ${item.teacher.name}` : ""}${item.session?.scheduledAt ? ` · ${formatRelativeDateTime(item.session.scheduledAt)}` : ""}`
                        : ""}
                      {item.feedback
                        ? ` · Rated ${item.feedback.rating}/5`
                        : ""}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
