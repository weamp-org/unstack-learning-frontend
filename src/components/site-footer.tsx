import Link from "next/link";

import { SITE_NAME, WEAMP_URL } from "@/lib/site";

/**
 * The in-app page, which links to each repo's own contributor graph. A link
 * straight to the frontend's graph would omit anyone who only contributed to
 * the backend.
 */
const CONTRIBUTORS_PATH = "/contributors";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      {/* Same width as the header, so the left edges line up. */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {SITE_NAME}
        </p>

        <p>
          Built by{" "}
          <a
            href={WEAMP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-weamp text-base font-normal hover:text-foreground"
          >
            WeAMP
            {/* The only link that leaves the site, so the only one to say so. */}
            <span className="sr-only"> (opens in new tab)</span>
          </a>{" "}
          and{" "}
          <Link href={CONTRIBUTORS_PATH} className="hover:text-foreground">
            open-source contributors
          </Link>
        </p>

        <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
