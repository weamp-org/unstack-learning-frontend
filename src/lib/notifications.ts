import { isAxiosError } from "axios";

import api from "./api";

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
  createdAt: string;
}

export async function listNotifications(
  unreadOnly = false,
): Promise<InboxNotification[]> {
  const { data } = await api.get<InboxNotification[]>("/notifications/me", {
    params: unreadOnly ? { unreadOnly: "true" } : {},
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

/** Removes one inbox row. Permanent: the event does not come back. */
export async function dismissNotification(
  id: string,
): Promise<{ id: string; dismissed: boolean }> {
  const { data } = await api.delete<{ id: string; dismissed: boolean }>(
    `/notifications/${id}`,
  );
  return data;
}

/**
 * Empties the inbox. `readOnly` (the default) keeps anything still unread, so
 * the destructive case has to be asked for explicitly.
 */
export async function clearNotifications(
  readOnly = true,
): Promise<{ count: number }> {
  const { data } = await api.delete<{ count: number }>("/notifications", {
    params: { readOnly },
  });
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
  if (isAxiosError(error)) {
    const message = error.response?.data as { message?: unknown } | undefined;
    if (typeof message?.message === "string") {
      return message.message;
    }
  }
  return fallback;
}
