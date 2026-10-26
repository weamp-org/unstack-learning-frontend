import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/site";

/**
 * `noindex`, deliberately, and it stays in the footer.
 *
 * This page is about *repository commit history* — two outbound links to
 * GitHub contributor graphs — under a title that reads "Contributors —
 * Unstack Learning". Being linked from everywhere is a reason to be
 * *correct* about what it claims to be, and the honest claim here is "this
 * is a repository page".
 */
export const metadata: Metadata = {
  title: `Contributors — ${SITE_NAME}`,
  description: "The people who have built Unstack Learning.",
  robots: { index: false, follow: true },
};

/**
 * Unstack Learning spans two independently versioned repos, so neither one's
 * own contributor graph is the whole story — someone who only touched the
 * backend would be invisible in the frontend's graph.
 *
 * GitHub owns that data and paginates it correctly, so these point at its
 * pages rather than reproducing the list.
 */
const REPOS = [
  {
    name: "Frontend",
    slug: "unstack-learning-frontend",
    description: "Next.js app: help requests, teacher queues, and sessions.",
  },
  {
    name: "Backend",
    slug: "unstack-learning-backend",
    description: "NestJS API, Prisma, and PostgreSQL.",
  },
] as const;

export default function ContributorsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-heading text-4xl font-semibold tracking-wide">
        Contributors
      </h1>
      <p className="mt-3 text-muted-foreground">
        {SITE_NAME} is built in the open, across two repositories. Everyone who
        has committed to either one is listed by GitHub.
      </p>

      <ul className="mt-8 flex flex-col gap-4">
        {REPOS.map((repo) => (
          <li key={repo.slug}>
            <a
              href={`https://github.com/weamp-org/${repo.slug}/graphs/contributors`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading text-lg font-normal tracking-wide hover:underline"
            >
              {repo.name} contributors
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            <p className="text-sm text-muted-foreground">{repo.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
