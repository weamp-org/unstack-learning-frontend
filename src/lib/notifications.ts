import api, { apiErrorMessage } from "./api";

export type NotificationType =
  | "REQUEST_CREATED"
  | "REQUEST_ACCEPTED"
  | "SESSION_UPDATED"
  | "FEEDBACK_CREATED";

export interface InboxNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  requestId: string;
  request: {
    id: string;
    topic: string;
    status: "OPEN" | "ACCEPTED" | "CLOSED";
    subject: { id: string; name: string };
  };
  actor: { id: string; name: string } | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export async function listNotifications(
  options: { archived?: boolean; unreadOnly?: boolean } = {},
): Promise<InboxNotification[]> {
  const { data } = await api.get<InboxNotification[]>("/notifications/me", {
    params: {
      ...(options.archived ? { archived: "true" } : {}),
      ...(options.unreadOnly ? { unreadOnly: "true" } : {}),
    },
  });
  return data;
}

export async function unreadNotificationsCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>(
    "/notifications/me/unread-count",
  );
  return data.count;
}

export async function markNotificationRead(
  id: string,
): Promise<InboxNotification> {
  const { data } = await api.patch<InboxNotification>(
    `/notifications/${id}/read`,
  );
  return data;
}

export async function markAllNotificationsRead(): Promise<{ count: number }> {
  const { data } = await api.patch<{ count: number }>(
    "/notifications/me/read-all",
  );
  return data;
}

/** Soft delete: the row leaves the inbox and waits in the archive. */
export async function archiveNotification(
  id: string,
): Promise<InboxNotification> {
  const { data } = await api.patch<InboxNotification>(
    `/notifications/${id}/archive`,
  );
  return data;
}

/** Puts an archived row back in the inbox. */
export async function restoreNotification(
  id: string,
): Promise<InboxNotification> {
  const { data } = await api.patch<InboxNotification>(
    `/notifications/${id}/restore`,
  );
  return data;
}

/**
 * Archives the inbox: read rows by default, everything when `readOnly` is
 * false. Nothing is destroyed — archived rows can be restored or deleted from
 * the archive.
 */
export async function archiveAllNotifications(
  readOnly = true,
): Promise<{ count: number }> {
  const { data } = await api.patch<{ count: number }>(
    "/notifications/me/archive-all",
    undefined,
    { params: { readOnly } },
  );
  return data;
}

/** Hard delete, only offered from the archive. */
export async function deleteNotification(
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  const { data } = await api.delete<{ id: string; deleted: boolean }>(
    `/notifications/${id}`,
  );
  return data;
}

/** Empties the archive permanently. */
export async function deleteArchivedNotifications(): Promise<{
  count: number;
}> {
  const { data } = await api.delete<{ count: number }>(
    "/notifications/archive",
  );
  return data;
}

/** One-line human summary per notification type. */
export function notificationText(notification: InboxNotification): string {
  const actor = notification.actor?.name ?? "Someone";
  switch (notification.type) {
    case "REQUEST_CREATED":
      return `${actor} needs help with “${notification.request.topic}” (${notification.request.subject.name}).`;
    case "REQUEST_ACCEPTED":
      return `Your request “${notification.request.topic}” was accepted by ${actor}.`;
    case "SESSION_UPDATED":
      return `Session details were updated for “${notification.request.topic}”.`;
    case "FEEDBACK_CREATED":
      return `${actor} shared feedback on “${notification.request.topic}”.`;
  }
}

export function notificationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return apiErrorMessage(error, fallback);
}
