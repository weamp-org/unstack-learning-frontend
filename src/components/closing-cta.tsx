import { ClockIcon, GiftIcon, UsersIcon, VideoIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const FACTS = [
  { Icon: GiftIcon, label: "Free" },
  { Icon: UsersIcon, label: "One-on-one" },
  { Icon: VideoIcon, label: "Online" },
  { Icon: ClockIcon, label: "Request anytime" },
] as const;

export function ClosingCtaSection() {
  return (
    <section aria-labelledby="ready-heading" className="bg-muted/50">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-12 text-center md:py-16">
        <h2
          id="ready-heading"
          className="text-3xl font-bold tracking-tight text-balance"
        >
          Ready to get unstuck?
        </h2>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {FACTS.map(({ Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Icon aria-hidden="true" className="size-4 text-primary" />
              {label}
            </li>
          ))}
        </ul>
        <Button asChild size="lg" className="mt-8">
          <Link href="/requests/new">Get unstuck</Link>
        </Button>
      </div>
    </section>
  );
}
