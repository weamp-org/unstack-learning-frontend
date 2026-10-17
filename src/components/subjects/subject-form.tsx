"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { FormRequiredNote, RequiredMark } from "@/components/required-mark";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type SubjectFormValues, subjectFormSchema } from "@/lib/subjects";

interface SubjectFormProps {
  defaultValues?: Partial<SubjectFormValues>;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: { name: string; description?: string }) => void;
}

export function SubjectForm({
  defaultValues,
  submitLabel,
  submitting,
  onSubmit,
}: SubjectFormProps) {
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: { name: "", description: "", ...defaultValues },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
            name: values.name,
            description: values.description?.trim()
              ? values.description
              : undefined,
          }),
        )}
        className="flex flex-col gap-4"
      >
        <FormRequiredNote />
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="subject-name">
                Name <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id="subject-name"
                placeholder="e.g. Biology"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="subject-description">Description</FieldLabel>
              <Textarea
                {...field}
                id="subject-description"
                rows={3}
                placeholder="What does this subject cover?"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
