"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { RequireRoles } from "@/components/require-roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  type AvailabilityFormValues,
  availabilityErrorMessage,
  availabilityFormSchema,
  createAvailability,
  deleteAvailability,
  listMyAvailability,
  WEEKDAYS,
} from "@/lib/availability";

const MINE_KEY = ["availability", "mine"];

export default function TeacherAvailabilityPage() {
  return (
    <RequireRoles roles={["TEACHER", "ADMIN"]}>
      <AvailabilityManager />
    </RequireRoles>
  );
}

function AvailabilityManager() {
  const queryClient = useQueryClient();
  const windowsQuery = useQuery({
    queryKey: MINE_KEY,
    queryFn: listMyAvailability,
    retry: false,
  });

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      weekday: 1,
      startTime: "",
      endTime: "",
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: MINE_KEY });
  }

  const createMutation = useMutation({
    mutationFn: createAvailability,
    onSuccess: () => {
      invalidate();
      form.reset({ weekday: 1, startTime: "", endTime: "" });
      toast.success("Availability added.");
    },
    onError: (error) =>
      toast.error(availabilityErrorMessage(error, "Could not add window.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => {
      invalidate();
      toast.success("Availability removed.");
    },
    onError: (error) =>
      toast.error(availabilityErrorMessage(error, "Could not remove window.")),
  });

  const windows = windowsQuery.data ?? [];
  const byWeekday = new Map<number, typeof windows>();
  for (const window of windows) {
    const group = byWeekday.get(window.weekday) ?? [];
    group.push(window);
    byWeekday.set(window.weekday, group);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Your availability</h1>
      <p className="text-muted-foreground">
        Set the weekly hours you can help learners. Times are in Africa/Accra.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate({
              weekday: values.weekday,
              startTime: values.startTime,
              endTime: values.endTime,
            }),
          )}
          className="flex flex-col gap-4"
        >
          <Controller
            name="weekday"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="availability-weekday">Day</FieldLabel>
                <select
                  {...field}
                  id="availability-weekday"
                  aria-invalid={fieldState.invalid}
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none"
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <div className="flex gap-4">
            <Controller
              name="startTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex-1">
                  <FieldLabel htmlFor="availability-start">Start</FieldLabel>
                  <Input
                    {...field}
                    id="availability-start"
                    type="time"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="endTime"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex-1">
                  <FieldLabel htmlFor="availability-end">End</FieldLabel>
                  <Input
                    {...field}
                    id="availability-end"
                    type="time"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding…" : "Add window"}
          </Button>
        </form>
      </Form>

      {windowsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading windows…</p>
      ) : windowsQuery.isError ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load availability.
          </p>
          <Button variant="outline" onClick={() => windowsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : windows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No availability set yet. Add your first window above.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {WEEKDAYS.filter((day) => byWeekday.has(day.value)).map((day) => (
            <Card key={day.value}>
              <CardHeader>
                <CardTitle>{day.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {(byWeekday.get(day.value) ?? []).map((window) => (
                  <div
                    key={window.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>
                      {window.startTime} – {window.endTime}
                      {window.timezone !== "Africa/Accra"
                        ? ` (${window.timezone})`
                        : null}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(window.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
