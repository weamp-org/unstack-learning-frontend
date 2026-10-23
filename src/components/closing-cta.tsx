import { ClockIcon, GiftIcon, UsersIcon, VideoIcon } from "lucide-react";
import { GetUnstuckButton } from "@/components/get-unstuck-button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FACTS = [
  {
    Icon: GiftIcon,
    label: "Free",
    description: "Always free for learners.",
  },
  {
    Icon: UsersIcon,
    label: "One-on-one",
    description: "Your teacher's full attention.",
  },
  {
    Icon: VideoIcon,
    label: "Online",
    description: "Meet over a link, from anywhere.",
  },
  {
    Icon: ClockIcon,
    label: "Request anytime",
    description: "Send a request whenever. Teachers respond in their hours.",
  },
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

        <ul className="mt-8 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map(({ Icon, label, description }) => (
            <li key={label}>
              <Card className="h-full">
                <CardHeader>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon aria-hidden="true" className="size-5 text-primary" />
                  </span>
                  <CardTitle className="mt-2 text-base">{label}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <GetUnstuckButton />
        </div>
      </div>
    </section>
  );
}
