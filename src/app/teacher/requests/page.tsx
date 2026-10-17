"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listRequestQueue } from "@/lib/requests";

export default function TeacherRequestQueuePage() {
  return (
    <RequireRoles roles={["TEACHER", "ADMIN"]}>
      <RequestQueue />
    </RequireRoles>
  );
}

function RequestQueue() {
  const queueQuery = useQuery({
    queryKey: ["requests", "queue"],
    queryFn: listRequestQueue,
    retry: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Review queue</h1>
      <p className="text-muted-foreground">
        Open requests in your subjects, longest waiting first.
      </p>

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
      ) : queueQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Queue is clear. Nothing waiting for review.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {queueQuery.data.map((item) => (
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
