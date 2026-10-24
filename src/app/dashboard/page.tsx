"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CircleAlertIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  HandHelpingIcon,
  InboxIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAdminStats } from "@/lib/admin-stats";
import { listMyAvailability } from "@/lib/availability";
import { formatDate, formatRelativeDateTime } from "@/lib/datetime";
import {
  type HelpRequest,
  listMyHelpRequests,
  listRequestQueue,
} from "@/lib/requests";
import { getMyTeachingSubjects } from "@/lib/subjects";
import { fetchCurrentUser } from "@/lib/users";

/**
 * The signed-in home.
 *
 * Deliberately a triage hub rather than a stats wall: each role gets the one
 * thing that needs attention now, and links out to the full pages for
 * everything else. `/requests/me`, `/teacher/requests` and `/admin/overview`
 * remain the complete views; this page must not grow into a second copy of
 * them.
 */
export default function DashboardPage() {
  return (
    <RequireRoles roles={["STUDENT", "TEACHER", "ADMIN"]}>
      <Dashboard />
    </RequireRoles>
  );
}

function Dashboard() {
  // Same ["me"] key the header uses, so this shares the cache.
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const me = meQuery.data;
  const firstName = me?.name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance">
          Welcome back{firstName ? `, ${firstName}` : ""}.
        </h1>
      </div>

      {me?.role === "STUDENT" ? <StudentHome /> : null}
      {me?.role === "TEACHER" ? <TeacherHome teacherId={me.id} /> : null}
      {me?.role === "ADMIN" ? <AdminHome /> : null}
    </div>
  );
}

function StudentHome() {
  const requestsQuery = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: listMyHelpRequests,
    retry: false,
  });

  if (requestsQuery.isPending)
    return <LoadingLine label="Loading your requests…" />;
  if (requestsQuery.isError) {
    return (
      <ErrorCard
        message="Couldn't load your requests."
        onRetry={() => requestsQuery.refetch()}
      />
    );
  }

  const requests = requestsQuery.data;
  const open = requests.filter((item) => item.status === "OPEN");
  // Prefer a session we can actually join, then any accepted request.
  const nextSession =
    requests.find(
      (item) => item.status === "ACCEPTED" && item.session?.sessionUrl,
    ) ?? requests.find((item) => item.status === "ACCEPTED");

  const recent = [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <>
      {nextSession ? (
        <NextSessionCard request={nextSession} />
      ) : open.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HandHelpingIcon
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Waiting on a teacher
            </CardTitle>
            <CardDescription>
              {open.length === 1
                ? "Your request is open and teachers have been notified."
                : `${open.length} requests are open and teachers have been notified.`}{" "}
              It stays open until a teacher accepts it or you close it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {open.slice(0, 2).map((item) => (
              <Link
                key={item.id}
                href={`/requests/${item.id}`}
                className="text-sm font-medium hover:underline"
              >
                {item.topic}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {item.subject.name}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nothing in progress</CardTitle>
            <CardDescription>
              When something isn&apos;t clicking, ask. A teacher will review it
              and meet you live to work through it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/requests/new">Get unstuck</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {recent.length > 0 ? (
        <section
          aria-labelledby="recent-requests"
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="recent-requests" className="text-lg font-semibold">
              Your requests
            </h2>
            <Link
              href="/requests/me"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all
              <ArrowRightIcon aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {recent.map((item) => (
              <li key={item.id}>
                <Link href={`/requests/${item.id}`}>
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle className="text-sm">{item.topic}</CardTitle>
                      <CardDescription>
                        {item.subject.name} · {formatDate(item.createdAt)} ·{" "}
                        {statusLabel(item.status)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function TeacherHome({ teacherId }: { teacherId: string }) {
  const queueQuery = useQuery({
    queryKey: ["requests", "queue"],
    queryFn: listRequestQueue,
    retry: false,
  });
  const mineQuery = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: listMyHelpRequests,
    retry: false,
  });
  const subjectsQuery = useQuery({
    queryKey: ["teaching", "mine"],
    queryFn: getMyTeachingSubjects,
    retry: false,
  });
  const availabilityQuery = useQuery({
    queryKey: ["availability", "mine"],
    queryFn: listMyAvailability,
    retry: false,
  });

  const loading =
    queueQuery.isPending ||
    subjectsQuery.isPending ||
    availabilityQuery.isPending;

  if (loading) return <LoadingLine label="Loading your dashboard…" />;

  const queue = queueQuery.data ?? [];
  const subjects = subjectsQuery.data ?? [];
  const availability = availabilityQuery.data ?? [];
  const upcoming =
    (mineQuery.data ?? []).find(
      (item) => item.status === "ACCEPTED" && item.teacherId === teacherId,
    ) ?? null;

  return (
    <>
      {/*
        The most important thing on a teacher's first visit. Notifications are
        filtered by subject server-side, so a teacher with no subjects selected
        gets no requests at all and no explanation of why.
      */}
      {subjects.length === 0 ? (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleAlertIcon
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Pick your subjects first
            </CardTitle>
            <CardDescription>
              Requests are only sent to teachers who teach that subject. Until
              you choose yours, nothing will reach you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/teacher/subjects">Choose subjects</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          Icon={ClipboardListIcon}
          label="In your queue"
          value={queue.length}
          hint="Open requests in your subjects"
          href="/teacher/requests"
          action="Review queue"
        />
        <StatCard
          Icon={CalendarCheckIcon}
          label="Your next session"
          value={upcoming ? 1 : 0}
          hint={
            upcoming
              ? `${upcoming.topic} · ${upcoming.subject.name}`
              : "Nothing scheduled right now"
          }
          href={upcoming ? `/requests/${upcoming.id}` : "/teacher/requests"}
          action={upcoming ? "Open session" : "Find a request"}
        />
      </div>

      {upcoming ? <NextSessionCard request={upcoming} /> : null}

      {subjects.length > 0 && availability.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Set when you&apos;re available
            </CardTitle>
            <CardDescription>
              Availability decides who gets notified first. Without windows,
              you&apos;re notified for every request in your subjects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/teacher/availability">Add availability</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function AdminHome() {
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    retry: false,
  });

  if (statsQuery.isPending) return <LoadingLine label="Loading stats…" />;
  if (statsQuery.isError) {
    return (
      <ErrorCard
        message="Couldn't load stats."
        onRetry={() => statsQuery.refetch()}
      />
    );
  }

  const { overview, responsiveness } = statsQuery.data;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          Icon={InboxIcon}
          label="Open requests"
          value={overview.open}
          hint="Waiting for a teacher"
          href="/teacher/requests"
          action="Review queue"
        />
        <StatCard
          Icon={CircleAlertIcon}
          label="Over 45 minutes"
          value={responsiveness.staleOver45m}
          hint="Open and getting old"
          href="/admin/overview"
          action="See overview"
        />
        <StatCard
          Icon={GraduationCapIcon}
          label="Learners helped"
          value={overview.learnersHelped}
          hint="Accepted at least once"
          href="/admin/users"
          action="Manage users"
        />
        <StatCard
          Icon={UsersIcon}
          label="Sessions arranged"
          value={overview.sessionsArranged}
          hint="With a meeting link or time"
          href="/admin/overview"
          action="See overview"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/overview">Full overview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/subjects">Manage subjects</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/users">Manage users</Link>
        </Button>
      </div>
    </>
  );
}

function NextSessionCard({ request }: { request: HelpRequest }) {
  const session = request.session;

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="text-base">Your next session</CardTitle>
        <CardDescription>
          {request.topic} · {request.subject.name}
          {request.teacher?.name ? ` with ${request.teacher.name}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {session?.scheduledAt ? (
          <p className="text-sm font-medium">
            {formatRelativeDateTime(session.scheduledAt)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your teacher hasn&apos;t added a time yet. You&apos;ll be notified
            when they do.
          </p>
        )}
        {session?.sessionUrl ? (
          <Button asChild>
            <a
              href={session.sessionUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join session
            </a>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href={`/requests/${request.id}`}>View request</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function StatCard({
  Icon,
  label,
  value,
  hint,
  href,
  action,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
  hint: string;
  href: string;
  action: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon aria-hidden className="size-4 text-primary" />
        </span>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {action}
          <ArrowRightIcon aria-hidden="true" className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

function LoadingLine({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Something went wrong</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function statusLabel(status: HelpRequest["status"]): string {
  switch (status) {
    case "OPEN":
      return "Awaiting review";
    case "ACCEPTED":
      return "Accepted";
    case "CLOSED":
      return "Closed";
  }
}
