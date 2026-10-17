"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listMyHelpRequests } from "@/lib/requests";

export default function MyHelpRequestsPage() {
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
        <p className="text-sm text-muted-foreground">
          No requests yet. Ask for help when you&apos;re stuck.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requestsQuery.data.map((item) => (
            <li key={item.id}>
              <Link href={`/requests/${item.id}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>{item.topic}</CardTitle>
                    <CardDescription>
                      {item.subject.name} ·{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
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
