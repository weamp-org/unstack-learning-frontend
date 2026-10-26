"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PushToggle } from "@/components/push-toggle";
import { RequireRoles } from "@/components/require-roles";
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
import { formatRelativeDateTime } from "@/lib/datetime";
import {
  clearNotifications,
  dismissNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationErrorMessage,
  notificationText,
} from "@/lib/notifications";

const LIST_KEY = ["notifications", "mine"];

export default function NotificationsPage() {
  return (
    <RequireRoles roles={["STUDENT", "TEACHER", "ADMIN"]}>
      <Inbox />
    </RequireRoles>
  );
}

function Inbox() {
  const queryClient = useQueryClient();
  const [clearOpen, setClearOpen] = useState(false);
  const inboxQuery = useQuery({
    queryKey: LIST_KEY,
    queryFn: () => listNotifications(false),
    refetchInterval: 30_000,
    retry: false,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(notificationErrorMessage(error, "Could not mark as read.")),
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      invalidate();
      toast.success("All notifications marked as read.");
    },
    onError: (error) =>
      toast.error(
        notificationErrorMessage(error, "Could not mark all as read."),
      ),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissNotification(id),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(
        notificationErrorMessage(error, "Could not dismiss that notification."),
      ),
  });

  const clearMutation = useMutation({
    mutationFn: (readOnly: boolean) => clearNotifications(readOnly),
    onSuccess: (result) => {
      invalidate();
      setClearOpen(false);
      toast.success(
        result.count === 1
          ? "1 notification cleared."
          : `${result.count} notifications cleared.`,
      );
    },
    onError: (error) =>
      toast.error(
        notificationErrorMessage(error, "Could not clear notifications."),
      ),
  });

  const notifications = inboxQuery.data ?? [];
  const unread = notifications.filter((row) => row.readAt === null);
  const readCount = notifications.length - unread.length;
  // With nothing unread, clearing read rows is a full wipe, so the label and
  // the confirmation copy change rather than offering two destructive paths.
  const clearingEverything = unread.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            New requests for teachers, decisions and session updates for
            learners, and feedback for teachers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unread.length > 0 ? (
            <Button
              variant="outline"
              disabled={readAllMutation.isPending}
              onClick={() => readAllMutation.mutate()}
            >
              {readAllMutation.isPending ? "Marking…" : "Mark all read"}
            </Button>
          ) : null}
          {notifications.length > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setClearOpen(true)}
              disabled={readCount === 0}
            >
              {clearingEverything ? "Clear all" : `Clear read (${readCount})`}
            </Button>
          ) : null}
        </div>
      </div>

      <PushToggle />

      {inboxQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading notifications…</p>
      ) : inboxQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load notifications.
          </p>
          <Button variant="outline" onClick={() => inboxQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. New requests, acceptances, session updates, and
          feedback will show up here.
        </p>
      ) : (
        notifications.map((notification) => (
          <Card
            key={notification.id}
            className={
              notification.readAt === null ? "border-primary" : undefined
            }
          >
            <CardHeader>
              <CardTitle className="text-base">
                {notification.readAt === null ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block h-2 w-2 rounded-full bg-primary"
                    />
                    <span className="sr-only">Unread: </span>
                  </>
                ) : null}
                {notificationText(notification)}
              </CardTitle>
              <CardDescription>
                {formatRelativeDateTime(notification.createdAt)}
                {" · "}
                {notification.request.status === "OPEN"
                  ? "Awaiting review"
                  : notification.request.status === "ACCEPTED"
                    ? "Accepted"
                    : "Closed"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/requests/${notification.requestId}`}>
                  View request
                </Link>
              </Button>
              {notification.readAt === null ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={readMutation.isPending}
                  onClick={() => readMutation.mutate(notification.id)}
                >
                  Mark read
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                aria-label="Dismiss notification"
                disabled={dismissMutation.isPending}
                onClick={() => dismissMutation.mutate(notification.id)}
              >
                <XIcon aria-hidden="true" />
                Dismiss
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {clearingEverything
                ? "Clear all notifications?"
                : "Clear read notifications?"}
            </DialogTitle>
            <DialogDescription>
              {clearingEverything
                ? `This permanently removes all ${notifications.length} notifications. New activity will still arrive.`
                : `This permanently removes the ${readCount} notifications you have already read. ${unread.length} unread will stay.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={clearMutation.isPending}
              onClick={() => clearMutation.mutate(!clearingEverything)}
            >
              {clearMutation.isPending
                ? "Clearing…"
                : clearingEverything
                  ? "Clear all"
                  : "Clear read"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
