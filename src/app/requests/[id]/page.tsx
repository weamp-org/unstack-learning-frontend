"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getHelpRequest } from "@/lib/requests";

export default function HelpRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const requestQuery = useQuery({
    queryKey: ["requests", id],
    queryFn: () => getHelpRequest(id),
    retry: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      {requestQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading request…</p>
      ) : requestQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load this request. It may not exist or belong to
            someone else.
          </p>
          <Button variant="outline" asChild>
            <Link href="/requests/me">Back to my requests</Link>
          </Button>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {requestQuery.data.topic}
            </h1>
            <p className="text-muted-foreground">
              {requestQuery.data.subject.name} ·{" "}
              {new Date(requestQuery.data.createdAt).toLocaleDateString()}
            </p>
          </div>

          {requestQuery.data.details ? (
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Markdown>{requestQuery.data.details}</Markdown>
              </CardContent>
            </Card>
          ) : null}

          {requestQuery.data.links.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {requestQuery.data.links.map((link) => (
                  <div key={link.id} className="flex flex-col">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      {link.label || link.url}
                    </a>
                    {link.label ? (
                      <span className="text-xs text-muted-foreground">
                        {link.url}
                      </span>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Teacher review</CardTitle>
              <CardDescription>
                Teachers review new requests from the queue. Check back soon.
              </CardDescription>
            </CardHeader>
          </Card>
        </>
      )}
    </div>
  );
}
