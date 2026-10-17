"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { SubjectForm } from "@/components/subjects/subject-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createSubject,
  deleteSubject,
  fetchCurrentUser,
  listSubjects,
  type Subject,
  subjectErrorMessage,
  type UpdateSubjectInput,
  updateSubject,
} from "@/lib/subjects";

const ADMIN_SUBJECTS_KEY = ["subjects", "admin"];

export default function AdminSubjectsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });
  const isAdmin = meQuery.data?.role === "ADMIN";

  const subjectsQuery = useQuery({
    queryKey: ADMIN_SUBJECTS_KEY,
    queryFn: () => listSubjects(true),
    enabled: isAdmin,
    retry: false,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ADMIN_SUBJECTS_KEY });
  }

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast.success("Subject created.");
    },
    onError: (error) =>
      toast.error(subjectErrorMessage(error, "Could not create subject.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubjectInput }) =>
      updateSubject(id, input),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditing(null);
      toast.success("Subject updated.");
    },
    onError: (error) =>
      toast.error(subjectErrorMessage(error, "Could not update subject.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success("Subject deleted.");
    },
    onError: (error) =>
      toast.error(subjectErrorMessage(error, "Could not delete subject.")),
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(subject: Subject) {
    setEditing(subject);
    setDialogOpen(true);
  }

  const submitting = createMutation.isPending || updateMutation.isPending;
  const isSignedOut =
    meQuery.isError &&
    isAxiosError(meQuery.error) &&
    meQuery.error.response?.status === 401;

  if (meQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {isSignedOut ? "Sign in required" : "Admins only"}
            </CardTitle>
            <CardDescription>
              {isSignedOut
                ? "Sign in to manage subjects."
                : "This page is only for admins."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
        {meQuery.isError && !isSignedOut ? (
          <Button variant="outline" onClick={() => meQuery.refetch()}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manage subjects</h1>
        <Button onClick={openCreate}>New subject</Button>
      </div>
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status[0]?.toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {subjectsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading subjects…</p>
      ) : subjectsQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load subjects.
          </p>
          <Button variant="outline" onClick={() => subjectsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <SubjectList
          subjects={subjectsQuery.data.filter((subject) =>
            statusFilter === "all"
              ? true
              : statusFilter === "active"
                ? subject.isActive
                : !subject.isActive,
          )}
          onEdit={openEdit}
          onToggle={(subject) =>
            updateMutation.mutate({
              id: subject.id,
              input: { isActive: !subject.isActive },
            })
          }
          toggleDisabled={updateMutation.isPending}
          onDelete={setDeleting}
        />
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit subject" : "New subject"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Rename, describe, or toggle this subject. The URL slug never changes."
                : "Add a subject learners can request help with."}
            </DialogDescription>
          </DialogHeader>
          <SubjectForm
            key={editing?.id ?? "new"}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    description: editing.description ?? "",
                  }
                : undefined
            }
            submitLabel={editing ? "Save changes" : "Create subject"}
            submitting={submitting}
            onSubmit={(values) => {
              if (editing) {
                updateMutation.mutate({ id: editing.id, input: values });
              } else {
                createMutation.mutate(values);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subject?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `“${deleting.name}” will be permanently removed.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubjectList({
  subjects,
  onEdit,
  onToggle,
  toggleDisabled,
  onDelete,
}: {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onToggle: (subject: Subject) => void;
  toggleDisabled: boolean;
  onDelete: (subject: Subject) => void;
}) {
  if (subjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No subjects match this filter.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {subjects.map((subject) => (
        <li key={subject.id}>
          <Card>
            <CardHeader>
              <CardTitle>
                {subject.name}
                {subject.isActive ? null : " (inactive)"}
              </CardTitle>
              {subject.description ? (
                <CardDescription>{subject.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(subject)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={toggleDisabled}
                onClick={() => onToggle(subject)}
              >
                {subject.isActive ? "Deactivate" : "Reactivate"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(subject)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
