"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { unreadNotificationsCount } from "@/lib/notifications";

export function NotificationsBell() {
  const { isSignedIn } = useUser();
  const countQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: unreadNotificationsCount,
    enabled: isSignedIn === true,
    refetchInterval: 30_000,
    retry: false,
  });

  if (isSignedIn !== true) return null;
  const count = countQuery.data ?? 0;

  return (
    <Link
      href="/notifications"
      className="text-sm font-medium hover:underline"
      aria-label={
        count > 0
          ? `Notifications, ${count} unread`
          : "Notifications, none unread"
      }
    >
      Notifications
      {count > 0 ? (
        <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
