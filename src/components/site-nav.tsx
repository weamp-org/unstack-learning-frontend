import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import type { UserRole } from "@/lib/users";

const PUBLIC_LINKS = [{ href: "/subjects", label: "Browse subjects" }];

const SIGNED_IN_LINKS = [
  { href: "/requests/new", label: "Request help" },
  { href: "/requests/me", label: "My requests" },
];

const TEACHER_LINKS = [
  { href: "/teacher/requests", label: "Review queue" },
  { href: "/teacher/subjects", label: "Your subjects" },
  { href: "/teacher/availability", label: "Your availability" },
];

const ADMIN_LINKS = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/subjects", label: "Manage subjects" },
  { href: "/admin/users", label: "Manage users" },
];

async function getRole(): Promise<UserRole | null> {
  try {
    const { userId, getToken } = await auth();
    if (userId === null) return null;
    const token = await getToken();
    if (token === null) return null;
    const baseURL =
      process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
      "http://localhost:3000/api/v1";
    const response = await fetch(`${baseURL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const me = (await response.json()) as { role?: unknown };
    return me.role === "STUDENT" || me.role === "TEACHER" || me.role === "ADMIN"
      ? me.role
      : null;
  } catch {
    // Backend unreachable or Clerk misconfigured: render the public nav
    // rather than breaking the layout.
    return null;
  }
}

export async function SiteNav() {
  const role = await getRole();
  const links = [
    ...PUBLIC_LINKS,
    ...(role === null ? [] : SIGNED_IN_LINKS),
    ...(role === "TEACHER" || role === "ADMIN" ? TEACHER_LINKS : []),
    ...(role === "ADMIN" ? ADMIN_LINKS : []),
  ];

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium hover:underline"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
