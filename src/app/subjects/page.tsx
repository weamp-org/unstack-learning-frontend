"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listSubjects } from "@/lib/subjects";

export default function SubjectsPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => listSubjects(),
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
      <p className="text-muted-foreground">
        Subjects Unstack Learning can help with. Pick one to request help and
        meet a teacher on any meeting platform.
      </p>
      <div>
        <Button asChild>
          <Link href="/requests/new">Request help</Link>
        </Button>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading subjects…</p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load subjects.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-medium underline"
          >
            Try again
          </button>
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subjects yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((subject) => (
            <li key={subject.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{subject.name}</CardTitle>
                  {subject.description ? (
                    <CardDescription>{subject.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-muted-foreground">
                    {subject.slug}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
