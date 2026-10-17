"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
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

  const subjectsQuery = useQuery({
    queryKey: ADMIN_SUBJECTS_KEY,
    queryFn: () => listSubjects(true),
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
  const isForbidden =
    subjectsQuery.isError &&
    isAxiosError(subjectsQuery.error) &&
    subjectsQuery.error.response?.status === 403;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manage subjects</h1>
        <Button onClick={openCreate}>New subject</Button>
      </div>

      {subjectsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading subjects…</p>
      ) : isForbidden ? (
        <Card>
          <CardHeader>
            <CardTitle>Admins only</CardTitle>
            <CardDescription>
              You don&apos;t have permission to manage subjects.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : subjectsQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load subjects.
          </p>
          <Button variant="outline" onClick={() => subjectsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : subjectsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No subjects yet. Create the first one.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {subjectsQuery.data.map((subject) => (
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
                    onClick={() => openEdit(subject)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({
                        id: subject.id,
                        input: { isActive: !subject.isActive },
                      })
                    }
                  >
                    {subject.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleting(subject)}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
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
