import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee";
import type { Subject } from "@/lib/subjects";

/**
 * The most subjects the strip ever shows. The catalogue is small and curated
 * (6 at launch), so the full list is fetched and the cap applied here rather
 * than in the API — a backend `take` param only earns its keep if the list
 * ever grows past what fits comfortably in one cached response.
 */
const MAX_VISIBLE_SUBJECTS = 8;

async function getLandingSubjects(): Promise<Subject[] | null> {
  const baseURL =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:3000/api/v1";
  try {
    const response = await fetch(`${baseURL}/subjects`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as Subject[];
  } catch {
    // Backend unreachable at render time: hide the section rather than break
    // the landing page over a strip below the fold.
    return null;
  }
}

export async function SupportedSubjectsSection() {
  const subjects = await getLandingSubjects();
  if (subjects === null || subjects.length === 0) return null;

  const visible = subjects.slice(0, MAX_VISIBLE_SUBJECTS);

  return (
    <section
      aria-labelledby="supported-subjects-heading"
      className="mx-auto w-full max-w-5xl px-4 py-12 md:py-16"
    >
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Supported subjects
      </p>
      <h2
        id="supported-subjects-heading"
        className="mt-2 text-3xl font-bold tracking-tight text-balance"
      >
        Help in the subjects you&apos;re taking.
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">
        If it&apos;s listed here, a teacher can meet you on it — pick one and
        request help.
      </p>

      <Marquee
        pauseOnHover
        className="mt-8 -mx-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        {visible.map((subject) => (
          <Card key={subject.id} className="w-64 shrink-0">
            <CardHeader>
              <CardTitle className="text-base">{subject.name}</CardTitle>
              {subject.description ? (
                <CardDescription className="line-clamp-2">
                  {subject.description}
                </CardDescription>
              ) : null}
            </CardHeader>
          </Card>
        ))}
      </Marquee>

      <div className="mt-6">
        <Link
          href="/subjects"
          className="text-sm font-medium underline underline-offset-4 hover:text-foreground"
        >
          Browse all {subjects.length} subjects
        </Link>
      </div>
    </section>
  );
}
