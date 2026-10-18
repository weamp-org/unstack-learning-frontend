# Unstack Learning Frontend

The [Next.js 16](https://nextjs.org) frontend for Unstack Learning, with [Clerk](https://clerk.com) authentication, [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), and dark mode.

Unstack Learning connects learners with teachers for live help sessions. Learners describe what they're stuck on, teachers review the queue and share a manual meeting link (any platform: Zoom, Meet, etc), then they meet and the learner optionally leaves feedback.

## Features

- **Authentication** — Clerk (sign-in, sign-up, user button) with `proxy.ts` middleware (parses only) + `<RequireRoles>` client guards
- **Help requests** — Learner `requests/new|me|[id]` (create, edit OPEN, close, feedback `1-5` + comment) with RHF + zod
- **Teacher queue** — `teacher/requests` (subject filter + search, oldest first) → shared detail for accept/decline/session edit
- **Teacher setup** — `teacher/subjects` + `teacher/availability` (weekly windows + overrides)
- **Notifications + push** — Inbox, bell (30s poll), push toggle via web-push
- **Admin** — `admin/overview|subjects|users` (`<AdminOnly>`)
- **Dark mode** — Light/dark/system toggle via `next-themes`
- **UI components** — shadcn/ui (radix-nova style) with Tailwind v4
- **Code quality** — Biome (linter + formatter), Husky + lint-staged
- **TypeScript** — Strict mode, `@/*` path alias
- **React Compiler** — Enabled in `next.config.ts`
- **Data fetching** — TanStack Query + Axios with Clerk JWT auth interceptor (`invalidateQueries` on success, no optimistic updates)

## Prerequisites

- [Node.js](https://nodejs.org) 24+
- [pnpm](https://pnpm.io) 11.2.2
- A [Clerk](https://clerk.com) application (free tier)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
#    Copy .env.local.example to .env.local and fill in your Clerk values:
#    - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from Clerk Dashboard > API Keys)
#    - CLERK_SECRET_KEY                (from Clerk Dashboard > API Keys)

# 3. Start the dev server
pnpm dev
```

Visit `http://localhost:3001`. Sign up via the nav to test authentication.

## Project structure

```text
src/
├── app/
│   ├── globals.css          # Tailwind v4 + shadcn theme tokens
│   ├── layout.tsx           # Root layout (Clerk, ThemeProvider, QueryProvider, AuthTokenSetter, header/footer)
│   ├── page.tsx             # Home (Get unstuck. Keep learning. + live-session explainer)
│   ├── loading.tsx          # Loading spinner (page transitions)
│   ├── error.tsx            # Error boundary
│   ├── not-found.tsx        # 404 page
│   ├── subjects/page.tsx    # Public subject list → CTA to /requests/new
│   ├── requests/
│   │   ├── new/page.tsx     # Learner create (subject/topic/details/links) — RequireRoles
│   │   ├── me/page.tsx      # My requests (status, teacher, session, feedback) — RequireRoles
│   │   └── [id]/page.tsx    # Shared detail (edit OPEN, accept/decline/close, session edit, feedback) — RequireRoles
│   ├── teacher/
│   │   ├── requests/page.tsx     # Review queue (subject filter + search) — TEACHER,ADMIN
│   │   ├── subjects/page.tsx     # Teachable subjects — TEACHER,ADMIN
│   │   └── availability/page.tsx # Weekly windows + overrides — TEACHER,ADMIN
│   ├── notifications/page.tsx    # Inbox — all roles
│   └── admin/
│       ├── overview/page.tsx # Counts — ADMIN
│       ├── subjects/page.tsx # Subject CRUD — ADMIN
│       └── users/page.tsx    # Roster + roles — ADMIN
├── components/
│   ├── ui/                  # shadcn/ui (generated — Biome-ignored, don't hand-edit for style)
│   ├── query-provider.tsx   # TanStack Query provider (staleTime: 30s)
│   ├── theme-provider.tsx   # next-themes provider wrapper
│   ├── theme-toggle.tsx     # Light/dark toggle button
│   ├── require-roles.tsx    # Client guard (401 → Sign in required, wrong role → Restricted)
│   ├── admin-only.tsx       # RequireRoles ADMIN wrapper
│   ├── session-form.tsx     # Manual meeting link (any platform) + future-time form
│   ├── required-mark.tsx    # RequiredMark + FormRequiredNote
│   ├── site-nav.tsx         # Server role-aware nav (public fallback on fetch failure)
│   ├── notifications-bell.tsx
│   └── push-toggle.tsx
├── lib/
│   ├── api.ts               # Axios instance + Clerk auth interceptor (10s timeout, /api/v1 base)
│   ├── auth-token-setter.tsx # Clerk JWT → Axios interceptor
│   ├── requests.ts          # HelpRequest/Session/Feedback types + CRUD + feedback + zod schemas
│   ├── subjects.ts          # Subjects + teaching subjects
│   ├── users.ts             # /users/me + roster + roles
│   ├── availability.ts      # Teacher availability + overrides
│   └── utils.ts             # cn() helper (clsx + tailwind-merge)
└── proxy.ts                 # Clerk middleware (Next.js 16 name — parses only, no redirects)
```

## Configuration

| Variable                            | Description                                                 |
| ----------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (public, starts with `pk_`)           |
| `CLERK_SECRET_KEY`                  | Clerk secret key (private, starts with `sk_`)               |
| `NEXT_PUBLIC_BACKEND_BASE_URL`      | Unstack Learning API URL (default: `http://localhost:3000/api/v1`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`    | Web-push public key for push subscriptions (must match backend `VAPID_PUBLIC_KEY`) |

## Scripts

| Command          | Description                      |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Start dev server on port 3001    |
| `pnpm build`     | Production build                 |
| `pnpm start`     | Start production server          |
| `pnpm lint`      | Biome check (linter + formatter) |
| `pnpm format`    | Biome format (`--write`)         |
| `pnpm typecheck` | TypeScript check (`--noEmit`)    |

## Docs

- [Authentication](docs/auth.md) — Clerk setup, middleware, auth patterns
- [Theming](docs/theming.md) — Dark mode, CSS variables, custom tokens
- [Deployment](docs/deployment.md) — Build, environment variables, deploy targets

## License

MIT
