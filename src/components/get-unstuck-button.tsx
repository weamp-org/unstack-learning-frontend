"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * The landing's primary action, auth-aware.
 *
 * Signed-in visitors go straight to the request form. Signed-out visitors
 * get Clerk's sign-up modal (which also offers the sign-in path) and land
 * on the form after auth — instead of navigating to a "Sign in required"
 * gate that burns the click that brought them there.
 */
export function GetUnstuckButton() {
  const { isSignedIn } = useUser();

  if (isSignedIn === true) {
    return (
      <Button asChild size="lg">
        <Link href="/requests/new">Get unstuck</Link>
      </Button>
    );
  }

  return (
    <SignUpButton mode="modal" forceRedirectUrl="/requests/new">
      <Button size="lg">Get unstuck</Button>
    </SignUpButton>
  );
}
