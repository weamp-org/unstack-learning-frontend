"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createHelpRequest,
  type HelpRequestFormValues,
  helpRequestFormSchema,
  requestErrorMessage,
} from "@/lib/requests";
import { listSubjects } from "@/lib/subjects";

export default function NewHelpRequestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => listSubjects(),
    retry: false,
  });

  const form = useForm<HelpRequestFormValues>({
    resolver: zodResolver(helpRequestFormSchema),
    defaultValues: { subjectId: "", topic: "", details: "", links: [] },
  });
  const links = useFieldArray({ control: form.control, name: "links" });

  const createMutation = useMutation({
    mutationFn: createHelpRequest,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Request sent for review.");
      router.push(`/requests/${created.id}`);
    },
    onError: (error) =>
      toast.error(requestErrorMessage(error, "Could not send request.")),
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Request help</h1>
      <p className="text-muted-foreground">
        Describe what you&apos;re stuck on so a teacher can help you.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate({
              subjectId: values.subjectId,
              topic: values.topic,
              details: values.details?.trim() ? values.details : undefined,
              links: values.links.map((link) => ({
                url: link.url,
              })),
            }),
          )}
          className="flex flex-col gap-4"
        >
          <Controller
            name="subjectId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="request-subject">Subject</FieldLabel>
                <select
                  {...field}
                  id="request-subject"
                  aria-invalid={fieldState.invalid}
                  disabled={subjectsQuery.isPending}
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none disabled:opacity-50"
                >
                  <option value="">
                    {subjectsQuery.isPending
                      ? "Loading subjects…"
                      : "Choose a subject"}
                  </option>
                  {(subjectsQuery.data ?? []).map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="topic"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="request-topic">Topic</FieldLabel>
                <Input
                  {...field}
                  id="request-topic"
                  placeholder="e.g. Differentiation"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="details"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="request-details">Tell us more</FieldLabel>
                <Textarea
                  {...field}
                  id="request-details"
                  rows={5}
                  placeholder="What have you tried? Where exactly do you get stuck?"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Links (max 3)</span>
            {links.fields.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <Controller
                  name={`links.${index}.url`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-1 flex-col gap-1">
                      <Input
                        {...field}
                        placeholder="https://…"
                        aria-label={`Link ${index + 1} URL`}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </div>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => links.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            {links.fields.length < 3 ? (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => links.append({ url: "" })}
                >
                  Add link
                </Button>
              </div>
            ) : null}
          </div>

          {form.formState.errors.root ? (
            <FieldError errors={[form.formState.errors.root]} />
          ) : null}

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Sending…" : "Send request"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
