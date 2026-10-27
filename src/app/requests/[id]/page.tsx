"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RequireRoles } from "@/components/require-roles";
import { FormRequiredNote, RequiredMark } from "@/components/required-mark";
import { SessionDetailsForm } from "@/components/session-form";
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
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime } from "@/lib/datetime";
import {
  acceptHelpRequest,
  closeHelpRequest,
  declineHelpRequest,
  defaultSessionTime,
  type FeedbackFormValues,
  feedbackFormSchema,
  getHelpRequest,
  requestErrorMessage,
  toDateTimeLocal,
  updateHelpRequest,
  updateHelpSession,
  upsertFeedback,
} from "@/lib/requests";
import { getMyTeachingSubjects } from "@/lib/subjects";
import { fetchCurrentUser } from "@/lib/users";

const editRequestSchema = z.object({
  topic: z
    .string()
    .min(1, "Give your request a topic.")
    .max(120, "Topic must be 120 characters or fewer."),
  details: z
    .string()
    .trim()
    .min(1, "Tell us a bit more about what you're stuck on.")
    .max(5000, "Details must be 5000 characters or fewer."),
  links: z
    .array(z.object({ url: z.string().url("Enter a valid URL.") }))
    .max(3, "At most 3 links."),
});

type EditRequestValues = z.infer<typeof editRequestSchema>;

export default function HelpRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <RequireRoles roles={["STUDENT", "TEACHER", "ADMIN"]}>
      <Detail params={params} />
    </RequireRoles>
  );
}

function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [editSessionOpen, setEditSessionOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["requests"] });
  }

  const acceptMutation = useMutation({
    mutationFn: (input: { sessionUrl?: string; scheduledAt?: string }) =>
      acceptHelpRequest(id, input),
    onSuccess: () => {
      invalidate();
      setAcceptOpen(false);
      toast.success("Request accepted.");
    },
    onError: (error) => {
      // 409 means another teacher got there first: nothing failed, so say so
      // as a warning and refresh to show the new state.
      if (isAxiosError(error) && error.response?.status === 409) {
        invalidate();
        setAcceptOpen(false);
        toast.warning("Another teacher already took this request.");
        return;
      }
      toast.error(requestErrorMessage(error, "Could not accept request."));
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: (input: { sessionUrl?: string; scheduledAt?: string }) =>
      updateHelpSession(id, input),
    onSuccess: () => {
      invalidate();
      setEditSessionOpen(false);
      toast.success("Session updated.");
    },
    onError: (error) =>
      toast.error(requestErrorMessage(error, "Could not update session.")),
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

  const editMutation = useMutation({
    mutationFn: (values: EditRequestValues) =>
      updateHelpRequest(id, {
        topic: values.topic,
        details: values.details,
        links: values.links,
      }),
    onSuccess: () => {
      invalidate();
      setEditOpen(false);
      toast.success("Request updated.");
    },
    onError: (error) =>
      toast.error(requestErrorMessage(error, "Could not update request.")),
  });

  const feedbackMutation = useMutation({
    mutationFn: (values: FeedbackFormValues) =>
      upsertFeedback(id, {
        rating: values.rating,
        comment: values.comment?.trim() ? values.comment : undefined,
      }),
    onSuccess: () => {
      invalidate();
      setFeedbackOpen(false);
      toast.success("Thanks for the feedback.");
    },
    onError: (error) =>
      toast.error(requestErrorMessage(error, "Could not save feedback.")),
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
  const canEditSession =
    request.session !== null &&
    request.session !== undefined &&
    (isAssignedTeacher || role === "ADMIN");
  const canEdit = isOwner && request.status === "OPEN";
  const canGiveFeedback = isOwner && request.status !== "OPEN";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{request.topic}</h1>
        <p className="text-muted-foreground">
          {request.subject.name} · {formatDate(request.createdAt)}
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
                Scheduled for {formatDateTime(request.session.scheduledAt)}
              </p>
            ) : null}
          </CardContent>
        ) : null}
        {(canAct || canClose || canEditSession || canEdit) && (
          <CardContent className="flex flex-wrap gap-2">
            {canAct ? (
              <>
                <Button onClick={() => setAcceptOpen(true)}>Accept</Button>
                <Button variant="outline" onClick={() => setDeclineOpen(true)}>
                  Decline
                </Button>
              </>
            ) : null}
            {canEdit ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit request
              </Button>
            ) : null}
            {canEditSession ? (
              <Button
                variant="outline"
                onClick={() => setEditSessionOpen(true)}
              >
                Edit session
              </Button>
            ) : null}
            {canClose ? (
              <Button variant="outline" onClick={() => setCloseOpen(true)}>
                Close request
              </Button>
            ) : null}
          </CardContent>
        )}
      </Card>

      {request.feedback ? (
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>
              Rated {request.feedback.rating}/5
              {request.feedback.comment
                ? ` — “${request.feedback.comment}”`
                : ""}
            </CardDescription>
          </CardHeader>
          {canGiveFeedback ? (
            <CardContent>
              <Button variant="outline" onClick={() => setFeedbackOpen(true)}>
                Update feedback
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : canGiveFeedback ? (
        <Card>
          <CardHeader>
            <CardTitle>After your session</CardTitle>
            <CardDescription>
              Share how it went — a rating from 1 to 5 plus an optional note. It
              helps teachers improve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setFeedbackOpen(true)}>
              Give feedback
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this request?</DialogTitle>
            <DialogDescription>
              Optionally share a meeting link and time now — any platform works,
              links are added by hand. You can also arrange them afterwards. The
              time defaults to 15 minutes from now.
            </DialogDescription>
          </DialogHeader>
          <SessionDetailsForm
            key={acceptOpen ? "open" : "closed"}
            defaultValues={{
              sessionUrl: "",
              scheduledAt: defaultSessionTime(),
            }}
            submitLabel="Accept"
            submitting={acceptMutation.isPending}
            onCancel={() => setAcceptOpen(false)}
            onSubmit={(values) => acceptMutation.mutate(values)}
          />
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
              Closed requests leave every queue. This can&apos;t be undone — if
              you need help again, create a new request.
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

      <Dialog open={editSessionOpen} onOpenChange={setEditSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit session</DialogTitle>
            <DialogDescription>
              Update the meeting link or time. The learner sees the latest
              details on this page.
            </DialogDescription>
          </DialogHeader>
          <SessionDetailsForm
            key={request.session?.updatedAt ?? "new"}
            defaultValues={{
              sessionUrl: request.session?.sessionUrl ?? "",
              scheduledAt: request.session?.scheduledAt
                ? toDateTimeLocal(new Date(request.session.scheduledAt))
                : "",
            }}
            submitLabel="Save session"
            submitting={updateSessionMutation.isPending}
            onCancel={() => setEditSessionOpen(false)}
            onSubmit={(values) => updateSessionMutation.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit request</DialogTitle>
            <DialogDescription>
              Only open requests can be edited. Subject stays the same so
              routing doesn&apos;t change.
            </DialogDescription>
          </DialogHeader>
          <EditRequestForm
            key={request.updatedAt}
            defaultValues={{
              topic: request.topic,
              details: request.details ?? "",
              links: request.links.map((link) => ({ url: link.url })),
            }}
            submitting={editMutation.isPending}
            onCancel={() => setEditOpen(false)}
            onSubmit={(values) => editMutation.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share feedback</DialogTitle>
            <DialogDescription>
              After your session — rate it 1 to 5 and optionally add context.
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            key={request.feedback?.updatedAt ?? "new"}
            defaultValues={{
              rating: request.feedback?.rating ?? 5,
              comment: request.feedback?.comment ?? "",
            }}
            submitting={feedbackMutation.isPending}
            onCancel={() => setFeedbackOpen(false)}
            onSubmit={(values) => feedbackMutation.mutate(values)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditRequestForm({
  defaultValues,
  submitting,
  onCancel,
  onSubmit,
}: {
  defaultValues: EditRequestValues;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: EditRequestValues) => void;
}) {
  const form = useForm<EditRequestValues>({
    resolver: zodResolver(editRequestSchema),
    defaultValues,
  });
  const links = useFieldArray({ control: form.control, name: "links" });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormRequiredNote />
        <Controller
          name="topic"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Topic <RequiredMark />
              </FieldLabel>
              <Input {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="details"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Tell us more <RequiredMark />
              </FieldLabel>
              <Textarea {...field} rows={5} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Links (max 3)</span>
          {links.fields.map((item, index) => (
            <div key={item.id} className="flex gap-2">
              <Controller
                name={`links.${index}.url`}
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="flex flex-1 flex-col gap-1">
                    <Input
                      {...field}
                      placeholder="https://…"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </div>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => links.remove(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          {links.fields.length < 3 ? (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => links.append({ url: "" })}
              >
                Add link
              </Button>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function FeedbackForm({
  defaultValues,
  submitting,
  onCancel,
  onSubmit,
}: {
  defaultValues: FeedbackFormValues;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: FeedbackFormValues) => void;
}) {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormRequiredNote />
        <Controller
          name="rating"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Rating (1–5) <RequiredMark />
              </FieldLabel>
              <Input
                type="number"
                min={1}
                max={5}
                step={1}
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  )
                }
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="comment"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Comment</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                rows={4}
                placeholder="What helped? What could be better?"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save feedback"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
