import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_TAGLINE } from "@/lib/site";

export function HeroSection() {
  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
      <div className="flex flex-col items-start gap-5">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {SITE_TAGLINE}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
          Get unstuck with free, one-on-one help from a real teacher.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Pick a subject, tell us where you&apos;re stuck, and a teacher will
          review your request and meet you live to work through it — so you
          understand it, not just answer it.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/requests/new">Get unstuck</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#how-it-works">How it works</Link>
          </Button>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-lg">
        <Image
          src="/hero-from-confusion-to-clarity.png"
          alt="Illustration of a learner going from confusion to clarity with books and a laptop"
          width={1536}
          height={1024}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
