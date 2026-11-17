"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import {
  type RequestStatus,
  RequestStatusBadge,
  requestStatusShortLabel,
} from "@/components/requests/status-badge";
import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatRelativeDateTime } from "@/lib/datetime";
import { listMyHelpRequests } from "@/lib/requests";

const ALL_SUBJECTS = "all";
const STATUSES: RequestStatus[] = ["OPEN", "ACCEPTED", "CLOSED"];

export default function MyHelpRequestsPage() {
  return (
    <RequireRoles roles={["STUDENT", "TEACHER", "ADMIN"]}>
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-2xl p-8">
            <p className="text-sm text-muted-foreground">Loading requests…</p>
          </div>
        }
      >
        <MyRequests />
      </Suspense>
    </RequireRoles>
  );
}

function MyRequests() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const status = isStatus(statusParam) ? statusParam : "";
  const subjectParam = searchParams.get("subject") ?? "";

  const requestsQuery = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: listMyHelpRequests,
    retry: false,
  });

  const requests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data],
  );

  // Ignore a subject that no longer exists rather than showing an empty page.
  const subject =
    subjectParam && requests.some((item) => item.subjectId === subjectParam)
      ? subjectParam
      : "";

  // Subject options follow the status facet, and keep the active subject even
  // when the current status leaves it empty so the select never lies.
  const subjectOptions = useMemo(() => {
    const options = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    for (const item of requests) {
      if (status && item.status !== status) continue;
      const existing = options.get(item.subjectId);
      if (existing) existing.count += 1;
      else {
        options.set(item.subjectId, {
          id: item.subjectId,
          name: item.subject.name,
          count: 1,
        });
      }
    }
    if (subject && !options.has(subject)) {
      const match = requests.find((item) => item.subjectId === subject);
      if (match) {
        options.set(subject, {
          id: subject,
          name: match.subject.name,
          count: 0,
        });
      }
    }
    return [...options.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [requests, status, subject]);

  // Status counts follow the subject facet.
  const counts = useMemo(() => {
    const base = subject
      ? requests.filter((item) => item.subjectId === subject)
      : requests;
    return {
      ALL: base.length,
      OPEN: base.filter((item) => item.status === "OPEN").length,
      ACCEPTED: base.filter((item) => item.status === "ACCEPTED").length,
      CLOSED: base.filter((item) => item.status === "CLOSED").length,
    } satisfies Record<"ALL" | RequestStatus, number>;
  }, [requests, subject]);

  const visible = useMemo(
    () =>
      requests.filter(
        (item) =>
          (!status || item.status === status) &&
          (!subject || item.subjectId === subject),
      ),
    [requests, status, subject],
  );

  function applyFilters(nextStatus: RequestStatus | "", nextSubject: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");
    if (nextSubject) params.set("subject", nextSubject);
    else params.delete("subject");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  const hasRequests = requests.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My requests</h1>
        <Button asChild>
          <Link href="/requests/new">New request</Link>
        </Button>
      </div>

      {hasRequests ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <fieldset
            className="flex min-w-0 flex-wrap gap-2"
            aria-label="Filter by status"
          >
            <FilterTab
              label="All"
              count={counts.ALL}
              active={status === ""}
              onClick={() => applyFilters("", subject)}
            />
            {STATUSES.map((value) => (
              <FilterTab
                key={value}
                label={requestStatusShortLabel(value)}
                count={counts[value]}
                active={status === value}
                onClick={() => applyFilters(value, subject)}
              />
            ))}
          </fieldset>

          {subjectOptions.length > 1 ? (
            <Select
              value={subject || ALL_SUBJECTS}
              onValueChange={(value) =>
                applyFilters(status, value === ALL_SUBJECTS ? "" : value)
              }
            >
              <SelectTrigger
                aria-label="Filter by subject"
                className="w-full sm:w-56"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SUBJECTS}>All subjects</SelectItem>
                {subjectOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {visible.length} request{visible.length === 1 ? "" : "s"} shown
      </p>

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
      ) : !hasRequests ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            No requests yet. Ask for help when you&apos;re stuck — a teacher
            will review it and share a meeting link.
          </p>
          <Button asChild>
            <Link href="/requests/new">Request help</Link>
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            No requests match these filters.
          </p>
          <Button variant="outline" onClick={() => applyFilters("", "")}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item) => (
            <li key={item.id}>
              <Link href={`/requests/${item.id}`}>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{item.topic}</CardTitle>
                      <RequestStatusBadge status={item.status} />
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

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
      <span className="tabular-nums opacity-70">({count})</span>
    </Button>
  );
}

function isStatus(value: string | null): value is RequestStatus {
  return value === "OPEN" || value === "ACCEPTED" || value === "CLOSED";
}
