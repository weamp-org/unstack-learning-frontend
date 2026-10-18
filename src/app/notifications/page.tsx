"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

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

  const notifications = inboxQuery.data ?? [];
  const unread = notifications.filter((row) => row.readAt === null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            New requests for teachers, decisions and session updates for
            learners.
          </p>
        </div>
        {unread.length > 0 ? (
          <Button
            variant="outline"
            disabled={readAllMutation.isPending}
            onClick={() => readAllMutation.mutate()}
          >
            {readAllMutation.isPending ? "Marking…" : "Mark all read"}
          </Button>
        ) : null}
      </div>

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
          Nothing here yet. New requests, acceptances and session updates will
          show up here.
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
                {new Date(notification.createdAt).toLocaleString()}
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
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
