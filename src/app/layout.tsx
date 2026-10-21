import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Inter,
  Manrope,
} from "next/font/google";

import { QueryProvider } from "@/components/query-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthTokenSetter } from "@/lib/auth-token-setter";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontHeading = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
});

// Instrument Serif is scoped to the WeAMP wordmark only — nowhere else.
const fontWeamp = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-weamp",
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
  title: SITE_NAME,
  description: `${SITE_NAME} — free academic help. ${SITE_TAGLINE}`,
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
        fontWeamp.variable,
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
                {/* First tab stop on the page. With a sticky header, keyboard
                    users would otherwise tab through the nav on every route. */}
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-60 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-primary-foreground"
                >
                  Skip to content
                </a>
                <SiteHeader />
                {/*
                  `flex flex-col` so the centred pages — the error boundary,
                  the 404, and the loading spinner — can actually centre. They
                  all carry `flex-1 justify-center` on their root, which does
                  nothing unless their parent is a flex container.
                */}
                <main id="main" className="flex flex-1 flex-col">
                  {children}
                </main>
                <SiteFooter />
                <Toaster />
              </AuthTokenSetter>
            </QueryProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
