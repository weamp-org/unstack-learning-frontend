"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  availabilityErrorMessage,
  createAvailability,
  deleteAvailability,
  formatDuration,
  listMyAvailability,
  minutesBetween,
  WEEKDAYS,
} from "@/lib/availability";

const MINE_KEY = ["availability", "mine"];

interface DraftWindow {
  key: string;
  id: string | null;
  start: string;
  end: string;
}

type DraftWeek = Record<number, DraftWindow[]>;

function sameWindows(a: DraftWindow[], b: DraftWindow[]): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((window) => [window.id, window]));
  return a.every((window) => {
    const other = byId.get(window.id);
    return (
      other !== undefined &&
      other.start === window.start &&
      other.end === window.end
    );
  });
}

export default function TeacherAvailabilityPage() {
  return (
    <RequireRoles roles={["TEACHER", "ADMIN"]}>
      <AvailabilityManager />
    </RequireRoles>
  );
}

function AvailabilityManager() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftWeek | null>(null);

  const windowsQuery = useQuery({
    queryKey: MINE_KEY,
    queryFn: listMyAvailability,
    retry: false,
  });

  if (draft === null && windowsQuery.data !== undefined) {
    const initial: DraftWeek = {};
    for (const day of WEEKDAYS) initial[day.value] = [];
    for (const window of windowsQuery.data) {
      initial[window.weekday]?.push({
        key: window.id,
        id: window.id,
        start: window.startTime,
        end: window.endTime,
      });
    }
    setDraft(initial);
  }

  const saveMutation = useMutation({
    mutationFn: async (plan: {
      deletes: string[];
      creates: { weekday: number; start: string; end: string }[];
    }) => {
      // Deletes first: an edited row would otherwise overlap its old self.
      await Promise.all(plan.deletes.map((id) => deleteAvailability(id)));
      await Promise.all(
        plan.creates.map((window) =>
          createAvailability({
            weekday: window.weekday,
            startTime: window.start,
            endTime: window.end,
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
      setDraft(null);
      toast.success("Availability saved.");
    },
    onError: (error) =>
      toast.error(availabilityErrorMessage(error, "Could not save.")),
  });

  const server: DraftWeek = {};
  for (const day of WEEKDAYS) server[day.value] = [];
  for (const window of windowsQuery.data ?? []) {
    server[window.weekday]?.push({
      key: window.id,
      id: window.id,
      start: window.startTime,
      end: window.endTime,
    });
  }

  const current = draft ?? server;
  const dirty =
    draft !== null &&
    WEEKDAYS.some((day) => !sameWindows(current[day.value], server[day.value]));

  const weekMinutes = WEEKDAYS.reduce(
    (sum, day) =>
      sum +
      current[day.value].reduce(
        (daySum, window) =>
          daySum + (minutesBetween(window.start, window.end) ?? 0),
        0,
      ),
    0,
  );

  function updateRow(
    weekday: number,
    key: string,
    patch: Partial<DraftWindow>,
  ) {
    setDraft((prev) => {
      const base = prev ?? server;
      return {
        ...base,
        [weekday]: base[weekday].map((window) =>
          window.key === key ? { ...window, ...patch } : window,
        ),
      };
    });
  }

  function addRow(weekday: number) {
    setDraft((prev) => {
      const base = prev ?? server;
      return {
        ...base,
        [weekday]: [
          ...base[weekday],
          {
            key:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            id: null,
            start: "09:00",
            end: "17:00",
          },
        ],
      };
    });
  }

  function removeRow(weekday: number, key: string) {
    setDraft((prev) => {
      const base = prev ?? server;
      return {
        ...base,
        [weekday]: base[weekday].filter((window) => window.key !== key),
      };
    });
  }

  function handleSave() {
    if (draft === null) return;
    const deletes: string[] = [];
    const creates: { weekday: number; start: string; end: string }[] = [];
    for (const day of WEEKDAYS) {
      const before = new Map(
        server[day.value].map((window) => [window.id, window]),
      );
      for (const window of draft[day.value]) {
        if (window.id === null) {
          creates.push({
            weekday: day.value,
            start: window.start,
            end: window.end,
          });
        } else {
          const original = before.get(window.id);
          if (
            original === undefined ||
            original.start !== window.start ||
            original.end !== window.end
          ) {
            // No PATCH endpoint: edited rows go through delete + recreate.
            if (window.id !== null) deletes.push(window.id);
            creates.push({
              weekday: day.value,
              start: window.start,
              end: window.end,
            });
          }
          if (original !== undefined) before.delete(window.id);
        }
      }
      for (const removed of before.values()) {
        if (removed.id !== null) deletes.push(removed.id);
      }
    }
    saveMutation.mutate({ deletes, creates });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Your availability</h1>
      <p className="text-muted-foreground">
        Set the weekly hours you can help learners. Times are in Africa/Accra.
      </p>

      {windowsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading availability…</p>
      ) : windowsQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load availability.
          </p>
          <Button variant="outline" onClick={() => windowsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            {WEEKDAYS.map((day) => {
              const dayMinutes = current[day.value].reduce(
                (sum, window) =>
                  sum + (minutesBetween(window.start, window.end) ?? 0),
                0,
              );
              return (
                <div
                  key={day.value}
                  className="flex gap-4 border-b py-3 last:border-b-0"
                >
                  <div className="w-24 shrink-0 pt-1.5 text-sm font-medium">
                    {day.label}
                    {dayMinutes > 0 ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {formatDuration(dayMinutes)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {current[day.value].length === 0 ? (
                      <span className="pt-1.5 text-sm text-muted-foreground">
                        Closed
                      </span>
                    ) : (
                      current[day.value].map((window) => (
                        <div
                          key={window.key}
                          className="flex items-center gap-2"
                        >
                          <Input
                            type="time"
                            value={window.start}
                            onChange={(event) =>
                              updateRow(day.value, window.key, {
                                start: event.target.value,
                              })
                            }
                            aria-label={`${day.label} start`}
                            className="w-auto"
                          />
                          <span className="text-sm text-muted-foreground">
                            –
                          </span>
                          <Input
                            type="time"
                            value={window.end}
                            onChange={(event) =>
                              updateRow(day.value, window.key, {
                                end: event.target.value,
                              })
                            }
                            aria-label={`${day.label} end`}
                            className="w-auto"
                          />
                          <WindowDuration
                            start={window.start}
                            end={window.end}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(day.value, window.key)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addRow(day.value)}
                      >
                        Add hours
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {weekMinutes > 0 ? (
            <p className="text-sm text-muted-foreground">
              Total {formatDuration(weekMinutes)} / week
            </p>
          ) : null}
          <Button
            disabled={!dirty || saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? "Saving…" : "Save availability"}
          </Button>
        </>
      )}
    </div>
  );
}

function WindowDuration({ start, end }: { start: string; end: string }) {
  const minutes = minutesBetween(start, end);
  if (minutes === null) return null;
  return (
    <span className="text-sm text-muted-foreground">
      {formatDuration(minutes)}
    </span>
  );
}
