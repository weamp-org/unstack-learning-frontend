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
import { listRequestQueue } from "@/lib/requests";
import { listSubjects } from "@/lib/subjects";

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
  const queueQuery = useQuery({
    queryKey: ["requests", "queue"],
    queryFn: listRequestQueue,
    retry: false,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => listSubjects(),
    retry: false,
  });

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Review queue</h1>
      <p className="text-muted-foreground">
        Open requests in your subjects, longest waiting first.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          aria-label="Filter by subject"
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm outline-none"
        >
          <option value="">All subjects</option>
          {(subjectsQuery.data ?? []).map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
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
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {queueQuery.data?.length
            ? "No requests match these filters."
            : "Queue is clear. Nothing waiting for review."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/requests/${item.id}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>{item.topic}</CardTitle>
                    <CardDescription>
                      {item.subject.name} · {item.learner?.name ?? "Learner"} ·{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
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
