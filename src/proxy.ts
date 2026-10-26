import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isLandingPage = createRouteMatcher(["/"]);

/**
 * Clerk parses the session here; the only enforcement this file does is the
 * landing-page redirect below.
 *
 * The landing page exists to persuade visitors, so a signed-in reader landing
 * on it is a dead end. Redirecting from the edge keeps `/` a static prerender
 * for everyone else: putting `auth()` in the page itself would make it render
 * dynamically on every request and lose the hourly cache.
 *
 * The role is deliberately not resolved here — that would mean calling the API
 * from the edge on every visit. `/dashboard` is role-neutral and decides for
 * itself, the same way every other page in this app does.
 */
export default clerkMiddleware(async (auth, request) => {
  if (isLandingPage(request)) {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
