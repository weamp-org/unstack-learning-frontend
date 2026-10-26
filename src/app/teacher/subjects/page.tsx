"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getMyTeachingSubjects,
  listSubjects,
  setMyTeachingSubjects,
  subjectErrorMessage,
} from "@/lib/subjects";

const MINE_KEY = ["teaching", "mine"];

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export default function TeacherSubjectsPage() {
  return (
    <RequireRoles roles={["TEACHER", "ADMIN"]}>
      <TeachingSubjectsForm />
    </RequireRoles>
  );
}

function TeachingSubjectsForm() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[] | null>(null);

  const allQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => listSubjects(),
    retry: false,
  });
  const mineQuery = useQuery({
    queryKey: MINE_KEY,
    queryFn: getMyTeachingSubjects,
    retry: false,
  });

  const mineIds = (mineQuery.data ?? []).map((row) => row.subjectId);
  const current = selected ?? mineIds;
  const dirty = selected !== null && !sameSet(selected, mineIds);

  const saveMutation = useMutation({
    mutationFn: setMyTeachingSubjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
      setSelected(null);
      toast.success("Teaching subjects saved.");
    },
    onError: (error) =>
      toast.error(subjectErrorMessage(error, "Could not save subjects.")),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const base = prev ?? mineIds;
      return base.includes(id)
        ? base.filter((subjectId) => subjectId !== id)
        : [...base, id];
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Your subjects</h1>
      <p className="text-muted-foreground">
        Choose the subjects you can help learners with.
      </p>

      {allQuery.isPending || mineQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading subjects…</p>
      ) : allQuery.isError || mineQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load subjects.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              allQuery.refetch();
              mineQuery.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (allQuery.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No subjects yet.</p>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (dirty && selected) saveMutation.mutate(selected);
          }}
        >
          <ul className="flex flex-col gap-3">
            {(allQuery.data ?? []).map((subject) => (
              <li key={subject.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <label
                        htmlFor={`subject-${subject.id}`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={current.includes(subject.id)}
                          onCheckedChange={() => toggle(subject.id)}
                        />
                        {subject.name}
                      </label>
                    </CardTitle>
                    {subject.description ? (
                      <CardDescription>{subject.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
          <Button type="submit" disabled={!dirty || saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : "Save subjects"}
          </Button>
        </form>
      )}
    </div>
  );
}
