import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    number: "01",
    title: "Tell us where you're stuck.",
    description:
      "Pick a subject, add a topic, describe the problem and what you've tried, and attach anything that helps explain it.",
  },
  {
    number: "02",
    title: "A teacher picks it up.",
    description:
      "Teachers who are available are notified first. One accepts and proposes a meeting link and time. You hear about every update.",
  },
  {
    number: "03",
    title: "Work through it live.",
    description:
      "Meet your teacher live and work through it together. Ask questions until it clicks, so you can continue on your own. Afterwards, a quick rating helps teachers improve.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-14"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-12 md:py-16">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          How it works
        </p>
        <h2
          id="how-it-works-heading"
          className="mt-2 text-3xl font-bold tracking-tight text-balance"
        >
          Get help in three steps.
        </h2>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number}>
              <Card className="h-full">
                <CardHeader>
                  <span
                    aria-hidden="true"
                    className="text-sm font-bold tracking-widest text-primary"
                  >
                    {step.number}
                  </span>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          If nobody&apos;s free right away, your request stays open and reaches
          more teachers. You can edit it while it&apos;s open or close it
          anytime.
        </p>
      </div>
    </section>
  );
}
