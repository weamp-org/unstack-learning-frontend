import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description:
    "What information Unstack Learning collects, how it is used, and the choices available to you.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-heading text-4xl font-semibold tracking-wide">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: October 21, 2026
      </p>
      <p className="mt-6 leading-relaxed">
        Unstack Learning is a free academic-help initiative operated by{" "}
        <strong>WeAMP</strong> that connects learners with teachers for live
        help sessions.
      </p>
      <p className="mt-2 leading-relaxed">
        This is a starting policy covering what we collect today. It will grow
        as the product does.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        1. Information We Collect
      </h2>

      <h3 className="mt-6 font-medium">Account information</h3>
      <p className="mt-2 leading-relaxed">
        Authentication is handled by <strong>Clerk</strong>. Depending on your
        account, Clerk may process your name, email address, profile image, and
        authentication and session information.
      </p>
      <p className="mt-2 leading-relaxed">
        Unstack Learning keeps a local user record with your name, email
        address, role (student, teacher, or admin), and account dates.
      </p>

      <h3 className="mt-6 font-medium">Help requests and sessions</h3>
      <p className="mt-2 leading-relaxed">
        When you request help, we store the subject, topic, details, and any
        links you add, plus the session arrangement (meeting link and time),
        acceptance and closure records, and any feedback you leave.
      </p>

      <h3 className="mt-6 font-medium">Notifications</h3>
      <p className="mt-2 leading-relaxed">
        If you turn on push notifications, we store your device&apos;s push
        subscription so we can notify you about new requests, acceptances,
        session updates, and feedback.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        2. How We Use Information
      </h2>
      <p className="mt-2 leading-relaxed">We use information to:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6 leading-relaxed">
        <li>Provide and operate Unstack Learning</li>
        <li>Authenticate users and maintain sessions</li>
        <li>Route help requests to suitable teachers</li>
        <li>Arrange and run live help sessions</li>
        <li>Send request, session, and feedback notifications</li>
        <li>Moderate content and keep the service safe</li>
      </ul>
      <p className="mt-2 leading-relaxed">
        We do not sell your personal information.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        3. Service Providers
      </h2>
      <p className="mt-2 leading-relaxed">
        We rely on third-party providers for authentication (Clerk), hosting and
        infrastructure (Vercel for the frontend, Render for the API, Neon for
        the database), and media storage (Cloudflare R2). They process
        information as needed to provide their services.
      </p>

      <h2 className="mt-10 font-heading text-2xl font-semibold tracking-wide">
        4. Contact
      </h2>
      <p className="mt-2 leading-relaxed">
        For privacy questions or requests concerning your information, contact{" "}
        <strong>admin@weamp.org</strong>.
      </p>
    </div>
  );
}
