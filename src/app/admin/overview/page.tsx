"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminOnly } from "@/components/admin-only";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminStatsErrorMessage,
  fetchAdminStats,
  formatDuration,
  formatWaitMinutes,
} from "@/lib/admin-stats";

export default function AdminOverviewPage() {
  return (
    <AdminOnly>
      <Overview />
    </AdminOnly>
  );
}

function Overview() {
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    retry: false,
  });

  if (statsQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Loading stats…</p>
      </div>
    );
  }

  if (statsQuery.isError) {
    const message = adminStatsErrorMessage(
      statsQuery.error,
      "Couldn't load stats.",
    );
    toast.error(message);
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 p-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={() => statsQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { overview, responsiveness, bySubject, byTeacher, feedback } =
    statsQuery.data;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>

      <section aria-label="Totals" className="grid grid-cols-2 gap-3">
        <StatCard label="Total requests" value={String(overview.total)} />
        <StatCard label="Open now" value={String(overview.open)} />
        <StatCard label="Accepted" value={String(overview.accepted)} />
        <StatCard label="Closed" value={String(overview.closed)} />
        <StatCard
          label="Learners helped"
          value={String(overview.learnersHelped)}
        />
        <StatCard
          label="Sessions arranged"
          value={String(overview.sessionsArranged)}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Responsiveness</CardTitle>
          <CardDescription>
            How long learners wait for a first response.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <StatLine
            label="Median time to accept"
            value={formatDuration(responsiveness.medianSecondsToAccept)}
          />
          <StatLine
            label="P90 time to accept"
            value={formatDuration(responsiveness.p90SecondsToAccept)}
          />
          <StatLine
            label="Accepted within 1h"
            value={
              responsiveness.pctAcceptedUnder1h === null
                ? "—"
                : `${Math.round(responsiveness.pctAcceptedUnder1h * 100)}%`
            }
          />
          <StatLine
            label="Stale over 45m"
            value={String(responsiveness.staleOver45m)}
          />
          <StatLine
            label="Unanswered over 24h"
            value={String(responsiveness.unansweredOver24h)}
          />
          <StatLine
            label="Longest waiter now"
            value={formatWaitMinutes(overview.oldestOpenWaitMinutes)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demand by subject</CardTitle>
          <CardDescription>
            Where requests are coming from. Accepted counts include closed
            requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bySubject.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {bySubject.map((row) => (
                <li
                  key={row.subjectId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium">{row.subjectName}</span>
                  <span className="text-muted-foreground">
                    {row.accepted}/{row.total} accepted
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teacher load</CardTitle>
          <CardDescription>
            Accepts, declines, and median response time per teacher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byTeacher.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teacher activity yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {byTeacher.map((row) => (
                <li
                  key={row.teacherId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium">{row.teacherName}</span>
                  <span className="text-muted-foreground">
                    {row.accepts} accepted · {row.declines} declined ·{" "}
                    {formatDuration(row.medianSecondsToAccept)} median
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learner feedback</CardTitle>
          <CardDescription>
            Ratings learners left after their sessions (1–5).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <StatLine
              label="Feedback coverage"
              value={
                feedback.coverage === null
                  ? "—"
                  : `${Math.round(feedback.coverage * 100)}%`
              }
            />
            <StatLine
              label="Average rating"
              value={
                feedback.averageRating === null
                  ? "—"
                  : feedback.averageRating.toFixed(1)
              }
            />
          </div>
          {feedback.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              No feedback yet. Coverage is the share of accepted + closed
              requests with a rating.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-1">
                {feedback.distribution.map((row) => (
                  <li
                    key={row.rating}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="font-medium">{row.rating} ★</span>
                    <span className="text-muted-foreground">
                      {row.count} rating{row.count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
              {feedback.recentComments.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {feedback.recentComments.map((item) => (
                    <li
                      key={item.requestId}
                      className="flex flex-col gap-1 border-t pt-2 text-sm"
                    >
                      <span className="font-medium">
                        {item.rating} ★ · {item.topic} ({item.subjectName})
                      </span>
                      <span className="text-muted-foreground">
                        {item.comment}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
