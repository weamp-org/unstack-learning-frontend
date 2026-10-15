# Deployment

## Build

```bash
pnpm build
```

Output goes to `.next/`. You can test it locally with:

```bash
pnpm start
```

## Environment variables

These must be set in your deployment environment:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_***
CLERK_SECRET_KEY=sk_***
NEXT_PUBLIC_BACKEND_BASE_URL=https://your-api.com/api/v1
```

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_BACKEND_BASE_URL` are public and must be available to the browser. `CLERK_SECRET_KEY` is server-only.

## Deploy targets

Production deploys to **Vercel**:

1. Push to a Git repository
2. Import on [Vercel](https://vercel.com/new)
3. Set the three environment variables in the project settings (`NEXT_PUBLIC_BACKEND_BASE_URL` must point at the Render API, including the `/api/v1` prefix)
4. Deploy — zero configuration needed for Next.js

`NEXT_PUBLIC_*` values are inlined at build time, so changing them requires a rebuild.

## Clerk configuration

In your Clerk Dashboard > **Sessions**, add your production URL to:

- **Application URLs** → **Redirect URLs** (e.g. `https://yourdomain.com`)
- **Application URLs** → **Post-sign-up URL**
- **Application URLs** → **Post-sign-in URL**

## Checklist

1. Run `pnpm typecheck` and `pnpm lint`
2. Run `pnpm build` — confirm it succeeds
3. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_BACKEND_BASE_URL` in the deployment
4. Update Clerk Dashboard with your production URLs
5. Deploy and test sign-up/sign-in flow
