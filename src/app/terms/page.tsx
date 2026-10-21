import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description:
    "The ground rules for using Unstack Learning's free academic help.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-heading text-4xl font-semibold tracking-wide">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: October 21, 2026
      </p>
      <p className="mt-6 leading-relaxed">
        Unstack Learning is a free academic-help initiative operated by{" "}
        <strong>WeAMP</strong>. By using it, you agree to these starting terms.
        They will grow as the product does.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        1. What We Offer
      </h2>
      <p className="mt-2 leading-relaxed">
        Learners describe what they are stuck on, and volunteer teachers review
        requests and arrange live sessions to work through them. The goal is
        learner understanding and independence, not answers alone.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        2. Acceptable Use
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 leading-relaxed">
        <li>Use the service for genuine learning, not misconduct.</li>
        <li>Be respectful to teachers, learners, and moderators.</li>
        <li>
          Do not share harmful, abusive, or unlawful content in requests,
          sessions, or feedback.
        </li>
        <li>Do not misuse notifications or session links.</li>
      </ul>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        3. Sessions
      </h2>
      <p className="mt-2 leading-relaxed">
        Sessions are arranged between learners and teachers using a meeting link
        either side provides. Session availability is set by teachers and
        acceptance is at their discretion.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        4. Accounts and Roles
      </h2>
      <p className="mt-2 leading-relaxed">
        New accounts start as students. Teacher and admin roles are granted by
        existing admins. We may suspend accounts that misuse the service.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        5. Contact
      </h2>
      <p className="mt-2 leading-relaxed">
        Questions about these terms: <strong>admin@weamp.org</strong>.
      </p>
    </div>
  );
}
