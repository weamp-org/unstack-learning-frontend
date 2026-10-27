"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArchiveIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
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
  archiveAllNotifications,
  archiveNotification,
  deleteArchivedNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationErrorMessage,
  notificationText,
  restoreNotification,
} from "@/lib/notifications";

const INBOX_KEY = ["notifications", "inbox"];
const ARCHIVE_KEY = ["notifications", "archive"];

type Tab = "inbox" | "archive";
type DeleteTarget = { id: string } | "all" | null;

export default function NotificationsPage() {
  return (
    <RequireRoles roles={["STUDENT", "TEACHER", "ADMIN"]}>
      <Inbox />
    </RequireRoles>
  );
}

function Inbox() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("inbox");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const inboxQuery = useQuery({
    queryKey: INBOX_KEY,
    queryFn: () => listNotifications(),
    refetchInterval: 30_000,
    retry: false,
  });
  // Only fetched once the tab is opened: the archive is the rarer visit.
  const archiveQuery = useQuery({
    queryKey: ARCHIVE_KEY,
    queryFn: () => listNotifications({ archived: true }),
    enabled: tab === "archive",
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

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveNotification(id),
    onSuccess: () => {
      invalidate();
      toast.success("Archived. Find it under the Archived tab.");
    },
    onError: (error) =>
      toast.error(
        notificationErrorMessage(error, "Could not archive that notification."),
      ),
  });

  const archiveAllMutation = useMutation({
    mutationFn: (readOnly: boolean) => archiveAllNotifications(readOnly),
    onSuccess: (result) => {
      invalidate();
      setArchiveOpen(false);
      toast.success(
        result.count === 1
          ? "1 notification archived."
          : `${result.count} notifications archived.`,
      );
    },
    onError: (error) =>
      toast.error(
        notificationErrorMessage(error, "Could not archive notifications."),
      ),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreNotification(id),
    onSuccess: () => {
      invalidate();
      toast.success("Moved back to your inbox.");
    },
    onError: (error) =>
      toast.error(
        notificationErrorMessage(error, "Could not restore that notification."),
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (
      target: { id: string } | "all",
    ): Promise<{ id: string; deleted: boolean } | { count: number }> =>
      target === "all"
        ? deleteArchivedNotifications()
        : deleteNotification(target.id),
    onSuccess: (result) => {
      invalidate();
      setDeleteTarget(null);
      const count = "count" in result ? result.count : 1;
      toast.success(
        count === 1
          ? "1 notification deleted."
          : `${count} notifications deleted.`,
      );
    },
    onError: (error) =>
      toast.error(
        notificationErrorMessage(error, "Could not delete notifications."),
      ),
  });

  const notifications = inboxQuery.data ?? [];
  const archived = archiveQuery.data ?? [];
  const unread = notifications.filter((row) => row.readAt === null);
  const readCount = notifications.length - unread.length;
  // With nothing unread, archiving read rows means archiving everything, so
  // the label and the confirmation copy change instead of offering two paths.
  const archivingEverything = unread.length === 0;

  const archiveView = tab === "archive";
  const active = archiveView ? archiveQuery : inboxQuery;

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
          {archiveView ? (
            archived.length > 0 ? (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget("all")}
              >
                Delete all
              </Button>
            ) : null
          ) : (
            <>
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
                  onClick={() => setArchiveOpen(true)}
                  disabled={readCount === 0}
                >
                  {archivingEverything
                    ? `Archive all (${notifications.length})`
                    : `Archive read (${readCount})`}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={archiveView ? "outline" : "default"}
          aria-pressed={!archiveView}
          onClick={() => setTab("inbox")}
        >
          Inbox
        </Button>
        <Button
          size="sm"
          variant={archiveView ? "default" : "outline"}
          aria-pressed={archiveView}
          onClick={() => setTab("archive")}
        >
          Archived
          {archiveView && archived.length > 0 ? ` (${archived.length})` : ""}
        </Button>
      </div>

      {archiveView ? null : <PushToggle />}

      {active.isPending ? (
        <p className="text-sm text-muted-foreground">
          {archiveView ? "Loading archive…" : "Loading notifications…"}
        </p>
      ) : active.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            {archiveView
              ? "Couldn't load the archive."
              : "Couldn't load notifications."}
          </p>
          <Button variant="outline" onClick={() => active.refetch()}>
            Try again
          </Button>
        </div>
      ) : (archiveView ? archived : notifications).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {archiveView
            ? "Nothing archived. Archiving keeps a notification out of your inbox without deleting it."
            : "Nothing here yet. New requests, acceptances, session updates, and feedback will show up here."}
        </p>
      ) : archiveView ? (
        archived.map((notification) => (
          <Card key={notification.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {notificationText(notification)}
              </CardTitle>
              <CardDescription>
                {formatRelativeDateTime(notification.createdAt)}
                {" · "}
                {statusLabel(notification.request.status)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/requests/${notification.requestId}`}>
                  View request
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate(notification.id)}
              >
                <RotateCcwIcon aria-hidden="true" />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive hover:text-destructive"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget({ id: notification.id })}
              >
                <Trash2Icon aria-hidden="true" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))
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
                {statusLabel(notification.request.status)}
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
                disabled={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate(notification.id)}
              >
                <ArchiveIcon aria-hidden="true" />
                Archive
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {archivingEverything
                ? "Archive all notifications?"
                : "Archive read notifications?"}
            </DialogTitle>
            <DialogDescription>
              {archivingEverything
                ? `This moves all ${notifications.length} notifications to the archive. Nothing is deleted — you can restore or delete them from the Archived tab.`
                : `This moves the ${readCount} notifications you have already read to the archive. ${unread.length} unread will stay in your inbox.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={archiveAllMutation.isPending}
              onClick={() => archiveAllMutation.mutate(!archivingEverything)}
            >
              {archiveAllMutation.isPending
                ? "Archiving…"
                : archivingEverything
                  ? "Archive all"
                  : "Archive read"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === "all"
                ? "Delete all archived notifications?"
                : "Delete this notification?"}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget === "all"
                ? `This permanently removes all ${archived.length} archived notifications. It cannot be undone.`
                : "This permanently removes the notification from your archive. It cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget !== null) deleteMutation.mutate(deleteTarget);
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

function statusLabel(status: "OPEN" | "ACCEPTED" | "CLOSED"): string {
  return status === "OPEN"
    ? "Awaiting review"
    : status === "ACCEPTED"
      ? "Accepted"
      : "Closed";
}
