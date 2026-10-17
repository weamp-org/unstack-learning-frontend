"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  acceptHelpRequest,
  closeHelpRequest,
  declineHelpRequest,
  getHelpRequest,
  requestErrorMessage,
} from "@/lib/requests";
import { getMyTeachingSubjects } from "@/lib/subjects";
import { fetchCurrentUser } from "@/lib/users";

const acceptFormSchema = z.object({
  sessionUrl: z
    .string()
    .url("Enter a valid URL.")
    .max(2048, "URL is too long.")
    .or(z.literal(""))
    .optional(),
  scheduledAt: z.string().optional(),
});

type AcceptFormValues = z.infer<typeof acceptFormSchema>;

export default function HelpRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });
  const requestQuery = useQuery({
    queryKey: ["requests", id],
    queryFn: () => getHelpRequest(id),
    retry: false,
  });

  const role = meQuery.data?.role;
  const teachingQuery = useQuery({
    queryKey: ["teaching", "mine"],
    queryFn: getMyTeachingSubjects,
    enabled: role === "TEACHER" || role === "ADMIN",
    retry: false,
  });

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptFormSchema),
    defaultValues: { sessionUrl: "", scheduledAt: "" },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
  }

  const acceptMutation = useMutation({
    mutationFn: (input: { sessionUrl?: string; scheduledAt?: string }) =>
      acceptHelpRequest(id, input),
    onSuccess: () => {
      invalidate();
      setAcceptOpen(false);
      form.reset();
      toast.success("Request accepted.");
    },
    onError: (error) =>
      toast.error(requestErrorMessage(error, "Could not accept request.")),
  });

  const declineMutation = useMutation({
    mutationFn: () => declineHelpRequest(id),
    onSuccess: () => {
      invalidate();
      setDeclineOpen(false);
      toast.success("Declined. The request stays open for other teachers.");
      router.push("/teacher/requests");
    },
    onError: (error) =>
      toast.error(requestErrorMessage(error, "Could not decline request.")),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeHelpRequest(id),
    onSuccess: () => {
      invalidate();
      setCloseOpen(false);
      toast.success("Request closed.");
    },
    onError: (error) =>
      toast.error(requestErrorMessage(error, "Could not close request.")),
  });

  if (requestQuery.isPending || meQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
        <p className="text-sm text-muted-foreground">Loading request…</p>
      </div>
    );
  }

  if (requestQuery.isError || meQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load this request. It may not exist or belong to someone
          else.
        </p>
        <div>
          <Button variant="outline" asChild>
            <Link href="/requests/me">Back to my requests</Link>
          </Button>
        </div>
      </div>
    );
  }

  const request = requestQuery.data;
  const me = meQuery.data;
  const isOwner = request.learnerId === me.id;
  const isAssignedTeacher = request.teacherId === me.id;
  const holdsSubject =
    role === "ADMIN" ||
    (teachingQuery.data ?? []).some(
      (row) => row.subjectId === request.subjectId,
    );
  const canAct =
    request.status === "OPEN" &&
    (role === "ADMIN" || (role === "TEACHER" && holdsSubject));
  const canClose =
    request.status !== "CLOSED" &&
    (isOwner || isAssignedTeacher || role === "ADMIN");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{request.topic}</h1>
        <p className="text-muted-foreground">
          {request.subject.name} ·{" "}
          {new Date(request.createdAt).toLocaleDateString()}
        </p>
      </div>

      {request.details ? (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{request.details}</p>
          </CardContent>
        </Card>
      ) : null}

      {request.links.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {request.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-medium underline underline-offset-4"
              >
                {link.url}
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {request.status === "OPEN"
              ? "Awaiting review"
              : request.status === "ACCEPTED"
                ? "Accepted"
                : "Closed"}
          </CardTitle>
          <CardDescription>
            {request.status === "OPEN"
              ? "Teachers review new requests from the queue. Check back soon."
              : request.status === "ACCEPTED"
                ? `Accepted by ${request.teacher?.name ?? "a teacher"}.`
                : "This request is closed."}
          </CardDescription>
        </CardHeader>
        {request.status === "ACCEPTED" &&
        (request.session?.sessionUrl || request.session?.scheduledAt) ? (
          <CardContent className="flex flex-col gap-2">
            {request.session.sessionUrl ? (
              <Button asChild>
                <a
                  href={request.session.sessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join the session
                </a>
              </Button>
            ) : null}
            {request.session.scheduledAt ? (
              <p className="text-sm text-muted-foreground">
                Scheduled for{" "}
                {new Date(request.session.scheduledAt).toLocaleString()}
              </p>
            ) : null}
          </CardContent>
        ) : null}
        {(canAct || canClose) && (
          <CardContent className="flex flex-wrap gap-2">
            {canAct ? (
              <>
                <Button onClick={() => setAcceptOpen(true)}>Accept</Button>
                <Button variant="outline" onClick={() => setDeclineOpen(true)}>
                  Decline
                </Button>
              </>
            ) : null}
            {canClose ? (
              <Button variant="outline" onClick={() => setCloseOpen(true)}>
                Close request
              </Button>
            ) : null}
          </CardContent>
        )}
      </Card>

      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this request?</DialogTitle>
            <DialogDescription>
              Optionally share a meeting link and time now — you can also
              arrange them afterwards.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                acceptMutation.mutate({
                  sessionUrl: values.sessionUrl || undefined,
                  scheduledAt: values.scheduledAt
                    ? new Date(values.scheduledAt).toISOString()
                    : undefined,
                }),
              )}
              className="flex flex-col gap-4"
            >
              <Controller
                name="sessionUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="accept-url">Meeting link</FieldLabel>
                    <Input
                      {...field}
                      id="accept-url"
                      placeholder="https://meet.google.com/…"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="scheduledAt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="accept-time">Session time</FieldLabel>
                    <Input
                      {...field}
                      id="accept-time"
                      type="datetime-local"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAcceptOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={acceptMutation.isPending}>
                  {acceptMutation.isPending ? "Accepting…" : "Accept"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this request?</DialogTitle>
            <DialogDescription>
              It stays open for the other subject teachers, and you won&apos;t
              see it in your queue again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={declineMutation.isPending}
              onClick={() => declineMutation.mutate()}
            >
              {declineMutation.isPending ? "Declining…" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close this request?</DialogTitle>
            <DialogDescription>
              Closed requests leave every queue. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={closeMutation.isPending}
              onClick={() => closeMutation.mutate()}
            >
              {closeMutation.isPending ? "Closing…" : "Close request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
