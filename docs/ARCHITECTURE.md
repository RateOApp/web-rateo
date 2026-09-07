# web-rateo architecture

Rate'O web app, hosted at `https://app.rateo.ng`. Marketing site stays on Framer at
`rateo.ng`. Sibling repos: `../server-rateo` (API), `../new-rateo/app-rateo` (mobile feature
reference), `../admin-rateo` (stack reference only).

## Stack

Next 16.3 App Router, React 19, TypeScript strict, Tailwind v4, shadcn (radix-nova style,
`src/components/ui`), TanStack Query 5, axios, socket.io-client, `@clerk/nextjs` 7 (Phase 3),
zod 4 + react-hook-form, sonner toasts, lucide icons. Package manager: npm.

## Non-negotiables

- The browser never calls `api-prod.rateo.ng`. `API_BASE_URL` is server-only. There is no
  `NEXT_PUBLIC_` variable holding a backend URL.
- All client REST goes to same-origin `/api/<path>` which `src/app/api/[...path]/route.ts`
  forwards to `${API_BASE_URL}/<path>`, adding `Authorization: Bearer` from the httpOnly cookie.
- Server components fetch the backend directly through `src/lib/api/server.ts` (same cookie).
- No hard-coded hex in components. Colours come from tokens in `globals.css`.
- Never commit or push from an agent session.

## Session cookies

Set by the proxy when a token-issuing auth path returns `token`; cleared by
`POST /api/auth/logout`.

| Cookie | httpOnly | Purpose |
|---|---|---|
| `rateo_token` | yes | backend JWT, 30 days, `Secure` in prod, `SameSite=Lax`, path `/` |
| `rateo_role` | yes | `individual` or `company`, read by `proxy.ts` to route `/dashboard` |

`/api/auth/social-login` is a dedicated route handler (not the `/api` catch-all): it reads the
signed-in Clerk user server-side with `currentUser()`, calls the backend, and sets the same two
cookies from the response `token`/`role`.

`proxy.ts` (Next 16 name for middleware) only checks cookie presence and role. It is wrapped in
`clerkMiddleware()` when both Clerk keys are set, and runs bare when they are not. It never
verifies the JWT (the backend does). The dashboard layout fetches `/auth/profile` server-side;
a 401 there clears cookies and redirects to `/login`; `setupCompleted === false` redirects to
`/setup`.

## Routes

```
(public)   /            -> redirect /jobs
           /jobs, /jobs/[id], /companies, /companies/[id], /search
(auth)     /login, /register, /register/company, /forgot-password, /verify,
           /reset-password, /sso-callback
(dashboard)/dashboard                     role-aware home
           /dashboard/(individual)/...    saved, my-jobs, preferences, work-history, resume, kyc
           /dashboard/(company)/...       jobs, jobs/new, jobs/[id]/applicants, candidates, employees
           /dashboard/{explore,ratings,profile,notifications,settings,messages}  shared, role-aware
           /setup                          wizard, role-aware
```

Nested route groups inside `dashboard/` give each role its own layout guard while keeping the
`/dashboard/...` URL prefix. A page that exists for both roles lives once in the shared group
and branches on role inside.

## Layout

Desktop: sticky top nav plus a centred content column (`max-w-6xl`). Mobile (< md): compact
top bar plus a fixed bottom tab bar. Tabs:

| Role | Tabs |
|---|---|
| individual | Home `/dashboard`, Explore `/dashboard/explore`, Ratings `/dashboard/ratings`, Saved `/dashboard/saved`, Profile `/dashboard/profile` |
| company | Home `/dashboard`, Explore `/dashboard/explore`, Ratings `/dashboard/ratings`, Candidates `/dashboard/candidates`, Profile `/dashboard/profile` |

Tab definitions live in `src/lib/nav.ts` and nowhere else.

## Design tokens

See `design/DESIGN_TOKENS.md`. Figma wins over mobile values. Font: Plus Jakarta Sans via
`next/font/google`, weights 400/500/600/700, CSS variable `--font-sans`.

## Data layer

- `src/types/api.ts` — hand-written types mirroring `docs/API_CONTRACT.md`.
- `src/services/*.ts` — plain functions, one file per backend domain. Client-side functions use
  the axios instance from `src/lib/api/client.ts` (baseURL `/api`). Server-side functions use
  `serverFetch` from `src/lib/api/server.ts`.
- `src/hooks/*` — TanStack Query hooks. Query keys follow the mobile app:
  `['jobs', params]`, `['job', id]`, `['jobCategories']`, `['companies', params]`,
  `['company', id]`, `['companyRatings', id]`, `['me']`, `['savedJobs']`, `['appliedJobs']`.
- Query defaults: `staleTime 60s`, `retry 1`, `refetchOnWindowFocus false`.

## Native feature mapping

Pickers -> `<input type=file>`; resume -> direct link; Dojah KYC -> hosted widget in iframe or
redirect from `POST /users/kyc/dojah/init`; PDF -> browser; swipe deck -> card list with
Like/Pass; push -> in-app bell; no version gate.
