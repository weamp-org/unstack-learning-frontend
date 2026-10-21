"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  BellIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  HandHelpingIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MenuIcon,
  SettingsIcon,
  ShapesIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { unreadNotificationsCount } from "@/lib/notifications";
import { fetchCurrentUser } from "@/lib/users";

/**
 * The signed-in header's secondary destinations, behind one button.
 *
 * Follows Worth Knowing's header-menu pattern: the primary CTA stands alone
 * as the only filled control, and everything else lives here ordered by how
 * often it is reached for. Role-gated items omit themselves rather than
 * rendering disabled, because a greyed-out item reads as "not allowed" and
 * invites the reader to work out why.
 */
export function HeaderMenu() {
  const { isSignedIn } = useUser();

  // Same ["me"] key the pages use, so this shares the cache instead of
  // firing its own copy of GET /users/me.
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    enabled: isSignedIn === true,
    retry: false,
  });
  const role = meQuery.data?.role;
  const isTeacherLike = role === "TEACHER" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  // The bell used to live beside the nav as its own header button and the
  // header ran out of room on narrow screens. The count moves in here: the
  // trigger carries the dot and the item below carries the number. No tight
  // poll — freshness comes from refetch on window focus plus invalidation
  // after read actions; the interval is only a backstop.
  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: unreadNotificationsCount,
    enabled: isSignedIn === true,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative px-2"
          aria-label={
            unread > 0 ? `Menu, ${unread} unread notifications` : "Menu"
          }
        >
          <MenuIcon aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 size-2 rounded-full bg-primary"
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem asChild>
          <Link href="/notifications">
            <BellIcon aria-hidden="true" />
            Notifications
            {unread > 0 ? (
              <span
                aria-hidden="true"
                className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/subjects">
            <LibraryIcon aria-hidden="true" />
            Browse subjects
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/requests/new">
            <HandHelpingIcon aria-hidden="true" />
            Request help
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/requests/me">
            <InboxIcon aria-hidden="true" />
            My requests
          </Link>
        </DropdownMenuItem>

        {isTeacherLike ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/teacher/requests">
                <ClipboardListIcon aria-hidden="true" />
                Review queue
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/teacher/subjects">
                <BookOpenIcon aria-hidden="true" />
                Your subjects
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/teacher/availability">
                <CalendarDaysIcon aria-hidden="true" />
                Your availability
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        {isAdmin ? (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/admin/overview">
                <LayoutDashboardIcon aria-hidden="true" />
                Overview
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/admin/subjects">
                <ShapesIcon aria-hidden="true" />
                Manage subjects
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/admin/users">
                <UsersIcon aria-hidden="true" />
                Manage users
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
