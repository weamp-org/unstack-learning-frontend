"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/datetime";
import { listRequestQueue } from "@/lib/requests";
import { getMyTeachingSubjects } from "@/lib/subjects";
import { fetchCurrentUser } from "@/lib/users";

/** Radix Select cannot use an empty string as an item value. */
const ALL_SUBJECTS = "all";

export default function TeacherRequestQueuePage() {
  return (
    <RequireRoles roles={["TEACHER", "ADMIN"]}>
      <RequestQueue />
    </RequireRoles>
  );
}

function RequestQueue() {
  const [subjectId, setSubjectId] = useState("");
  const [query, setQuery] = useState("");

  // Same ["me"] entry RequireRoles filled, so this costs no extra request.
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });
  const isAdmin = meQuery.data?.role === "ADMIN";

  const queueQuery = useQuery({
    queryKey: ["requests", "queue"],
    queryFn: listRequestQueue,
    retry: false,
  });

  // Only teachers need their subject list; the queue is already scoped to it
  // server-side, so this is here for the empty state and the scope copy.
  const teachingQuery = useQuery({
    queryKey: ["teaching", "mine"],
    queryFn: getMyTeachingSubjects,
    enabled: isAdmin === false,
    retry: false,
  });

  const subjects = useMemo(
    () => teachingQuery.data ?? [],
    [teachingQuery.data],
  );

  // Filter options come from the queue itself: offering a subject with no rows
  // (an admin's whole catalogue, a teacher's other subjects) only ever yields
  // an empty list and a misleading "no matches".
  const subjectOptions = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const item of queueQuery.data ?? []) {
      const entry = counts.get(item.subjectId);
      if (entry) entry.count += 1;
      else {
        counts.set(item.subjectId, {
          name: item.subject.name,
          count: 1,
        });
      }
    }
    return [...counts.entries()]
      .map(([id, entry]) => ({ id, ...entry }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [queueQuery.data]);

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (queueQuery.data ?? []).filter((item) => {
      if (subjectId && item.subjectId !== subjectId) return false;
      if (!needle) return true;
      const haystack =
        `${item.topic} ${item.details ?? ""} ${item.learner?.name ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [queueQuery.data, subjectId, query]);

  const queue = queueQuery.data ?? [];
  const hasNoSubjects =
    !isAdmin && teachingQuery.isSuccess && subjects.length === 0;
  const subjectNames = subjects
    .map((row) => row.subject.name)
    .sort((a, b) => a.localeCompare(b));

  function clearFilters() {
    setSubjectId("");
    setQuery("");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Review queue</h1>
      {isAdmin ? (
        <p className="text-muted-foreground">
          All open requests, oldest first. Teachers only see their own subjects.
        </p>
      ) : (
        <p className="text-muted-foreground">
          Open requests in your subjects, longest waiting first.{" "}
          <Link
            href="/teacher/subjects"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Change subjects
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {subjectOptions.length > 1 ? (
          <Select
            value={subjectId || ALL_SUBJECTS}
            onValueChange={(value) =>
              setSubjectId(value === ALL_SUBJECTS ? "" : value)
            }
          >
            <SelectTrigger
              aria-label="Filter by subject"
              className="w-full sm:w-56"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SUBJECTS}>
                All subjects ({queue.length})
              </SelectItem>
              {subjectOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search topic, details, learner…"
          aria-label="Search requests"
        />
      </div>

      {queueQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading queue…</p>
      ) : queueQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load the queue.
          </p>
          <Button variant="outline" onClick={() => queueQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : hasNoSubjects ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t picked subjects yet. Requests only appear for
            subjects you teach.
          </p>
          <Button variant="outline" asChild>
            <Link href="/teacher/subjects">Choose your subjects</Link>
          </Button>
        </div>
      ) : queue.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "No open requests right now."
            : subjectNames.length > 0 && subjectNames.length <= 3
              ? `Queue is clear — nothing open in ${subjectNames.join(", ")} right now.`
              : "Queue is clear — nothing open in your subjects right now."}
        </p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            No requests match these filters.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/requests/${item.id}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>{item.topic}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        {item.subject.name} · {item.learner?.name ?? "Learner"}{" "}
                        · {formatDate(item.createdAt)}
                      </span>
                      {attachmentSummary(item.media) ? (
                        <span className="text-muted-foreground">
                          {attachmentSummary(item.media)}
                        </span>
                      ) : null}
                      {item.hasTeacher === false ? (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          No teacher for this subject
                        </span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {item.details ? (
                      <p className="whitespace-pre-wrap text-sm">
                        {item.details}
                      </p>
                    ) : null}
                    {item.links.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {item.links.map((link) => (
                          <span
                            key={link.id}
                            className="break-all text-sm font-medium underline underline-offset-4"
                          >
                            {link.url}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function attachmentSummary(
  media: { kind: "IMAGE" | "AUDIO" }[] | undefined,
): string {
  const images = (media ?? []).filter((item) => item.kind === "IMAGE").length;
  const audio = (media ?? []).filter((item) => item.kind === "AUDIO").length;
  const parts: string[] = [];
  if (images > 0) parts.push(`${images} photo${images === 1 ? "" : "s"}`);
  if (audio > 0) parts.push(`${audio} voice note${audio === 1 ? "" : "s"}`);
  return parts.join(" · ");
}
