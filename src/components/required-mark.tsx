"use client";

export function RequiredMark() {
  return (
    <>
      <span className="text-destructive" aria-hidden="true">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}

export function FormRequiredNote({ extra }: { extra?: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <p>
        Fields marked{" "}
        <span className="text-destructive" aria-hidden="true">
          *
        </span>{" "}
        are required.
      </p>
      {extra ? <p>{extra}</p> : null}
    </div>
  );
}
