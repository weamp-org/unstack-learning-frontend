"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderMenu } from "@/components/header-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { fetchCurrentUser } from "@/lib/users";

export function SiteHeader() {
  const { isSignedIn } = useUser();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    enabled: isSignedIn === true,
    retry: false,
  });
  const role = meQuery.data?.role;
  const pathname = usePathname();
  // Teachers and admins live in the review queue; students live in the
  // request flow. One primary CTA per role keeps the header to a single
  // filled word either way.
  const isTeacherLike = role === "TEACHER" || role === "ADMIN";

  // On the landing page the wordmark link would navigate to the page it is
  // already on (a no-op), so scroll to the very top instead. Anywhere else
  // it stays a plain navigation to "/". Smoothness comes from the global
  // `scroll-behavior`, which also respects reduced motion.
  function handleWordmarkClick(event: React.MouseEvent) {
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0 });
    }
  }

  return (
    // `sticky` rather than `fixed`: it stays in flow and occupies its own
    // space, so nothing downstream needs padding to clear it.
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
        {/* `shrink-0` and `whitespace-nowrap` stop the wordmark being squeezed
            onto two lines when the controls beside it need the room. */}
        <Link
          href="/"
          onClick={handleWordmarkClick}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-heading text-lg font-normal tracking-wide hover:underline"
        >
          {/*
            Decorative: the wordmark text beside it already names the site, so
            this carries an empty alt rather than repeating "Unstack Learning"
            to a screen reader twice.

            The mark is a black glyph on transparency, so it inverts to white
            in dark mode rather than disappearing into the dark header.
          */}
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={24}
            height={24}
            className="size-6 dark:invert"
          />
          Unstack Learning
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/*
            Signed out only. A signed-in header carries the primary CTA, the
            disclosure and the avatar — two controls besides the primary — and
            on a phone that is the difference between the wordmark fitting and
            wrapping. Appearance lives in settings once you are signed in.
          */}
          <Show when="signed-out">
            <ThemeToggle />

            {/*
              Clerk renders its own unstyled button by default, which is what
              let these wrap onto two lines on narrow screens. Passing our
              Button as the child gives them the header's sizing and stops the
              wrap.
            */}
            <SignInButton mode="modal">
              <Button size="sm">Sign in</Button>
            </SignInButton>

            {/* Clerk's sign-in modal already offers sign-up, so on mobile one
                button is enough and saves the width the primary CTA needs. */}
            <SignUpButton mode="modal">
              <Button
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex"
              >
                Sign up
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Button asChild size="sm">
              {isTeacherLike ? (
                <Link href="/teacher/requests">
                  <span className="hidden sm:inline">Review queue</span>
                  <span className="sm:hidden">Review</span>
                </Link>
              ) : (
                <Link href="/requests/new">
                  <span className="hidden sm:inline">Request help</span>
                  <span className="sm:hidden">Request</span>
                </Link>
              )}
            </Button>

            <HeaderMenu />

            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
