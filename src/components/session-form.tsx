"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toDateTimeLocal } from "@/lib/requests";

const sessionDetailsSchema = z.object({
  sessionUrl: z
    .string()
    .url("Enter a valid URL.")
    .max(2048, "URL is too long.")
    .or(z.literal(""))
    .optional(),
  scheduledAt: z.string().optional(),
});

export type SessionDetailsValues = z.infer<typeof sessionDetailsSchema>;

interface SessionDetailsFormProps {
  defaultValues: SessionDetailsValues;
  submitLabel: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: { sessionUrl?: string; scheduledAt?: string }) => void;
}

export function SessionDetailsForm({
  defaultValues,
  submitLabel,
  submitting,
  onCancel,
  onSubmit,
}: SessionDetailsFormProps) {
  const form = useForm<SessionDetailsValues>({
    resolver: zodResolver(sessionDetailsSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          const at =
            values.scheduledAt && values.scheduledAt !== ""
              ? new Date(values.scheduledAt)
              : null;
          onSubmit({
            sessionUrl:
              values.sessionUrl && values.sessionUrl !== ""
                ? values.sessionUrl
                : undefined,
            scheduledAt:
              at !== null && !Number.isNaN(at.getTime())
                ? at.toISOString()
                : undefined,
          });
        })}
        className="flex flex-col gap-4"
      >
        <Controller
          name="sessionUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="session-url">Meeting link</FieldLabel>
              <Input
                {...field}
                id="session-url"
                placeholder="https://meet.google.com/…"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="scheduledAt"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="session-time">Session time</FieldLabel>
              <Input
                {...field}
                id="session-time"
                type="datetime-local"
                min={toDateTimeLocal(new Date())}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
