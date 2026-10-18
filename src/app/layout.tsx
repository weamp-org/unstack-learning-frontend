import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Manrope } from "next/font/google";
import Link from "next/link";

import { QueryProvider } from "@/components/query-provider";
import { SiteNav } from "@/components/site-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { AuthTokenSetter } from "@/lib/auth-token-setter";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontHeading = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unstack Learning",
  description:
    "Unstack Learning — free academic help. Get unstuck, build understanding, and keep learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        fontHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <QueryProvider>
              <AuthTokenSetter>
                <header className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 p-4">
                  <nav className="mr-auto flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Link
                      href="/"
                      className="text-sm font-medium hover:underline"
                    >
                      Unstack Learning
                    </Link>
                    <SiteNav />
                  </nav>
                  <ThemeToggle />
                  <Show when="signed-out">
                    <SignInButton />
                    <SignUpButton />
                  </Show>
                  <Show when="signed-in">
                    <UserButton />
                  </Show>
                </header>
                <main className="flex-1">{children}</main>
                <footer className="p-4 text-center text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Unstack Learning
                </footer>
                <Toaster />
              </AuthTokenSetter>
            </QueryProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
