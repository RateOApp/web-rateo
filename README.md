# web-rateo

The Rate'O web app — `https://app.rateo.ng`.

Rate'O is a two-sided Nigerian jobs and workplace-ratings platform. Individuals find and apply
for jobs and rate the companies they work for; companies post jobs, review candidates and are
rated back. This repo is the web client. The marketing site (`rateo.ng`) stays on Framer; the
Expo mobile app and the Express API live in sibling repos:

| Repo | What it is |
|---|---|
| `../server-rateo` | Express 5 + Mongoose + socket.io API, prod at `https://api-prod.rateo.ng/api` |
| `../new-rateo/app-rateo` | Expo mobile app — the feature reference |
| `../admin-rateo` | Admin console — stack reference only |

Design and contract docs: `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`,
`design/DESIGN_TOKENS.md`.

## Stack

Next 16.3 (App Router) · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · TanStack
Query 5 · axios · socket.io-client · `@clerk/nextjs` (Phase 3) · zod + react-hook-form · sonner
· lucide. Package manager: **npm**.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
npm run lint
npx tsc --noEmit
```

## Environment variables

| Variable | Scope | Required | Value |
|---|---|---|---|
| `API_BASE_URL` | **server only** | yes | Backend REST base including `/api`, e.g. `https://api-prod.rateo.ng/api` |
| `NEXT_PUBLIC_APP_URL` | public | no (defaults to `http://localhost:3000`) | This app's own origin — `https://app.rateo.ng` in prod. Used for OG metadata, `robots.txt`, `sitemap.xml` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | public | no | Clerk publishable key (same Clerk instance as the mobile app). Empty = no social sign-in |
| `CLERK_SECRET_KEY` | **server only** | no | Clerk secret key. Needed together with the publishable key for the server-side exchange |

Read them through `src/lib/env.ts` (`getApiBaseUrl()`, `getAppUrl()`) rather than
`process.env` — `getApiBaseUrl()` throws a clear error when the variable is missing and strips
a trailing slash.

Clerk is **optional at runtime** and is read through `src/lib/clerk.ts`: `clerkEnabled`
(publishable key present, client-safe) and `clerkServerEnabled()` (both keys present,
server-only). With the keys empty the app skips `<ClerkProvider>`, the
"Continue with Google / Apple / LinkedIn" buttons render nothing, `/sso-callback` redirects to
`/login`, `POST /api/auth/social-login` answers `503`, and `proxy.ts` runs the plain cookie
guard instead of `clerkMiddleware()`. `npm run build` passes without them.

## How auth and the API proxy work

The browser **never** talks to `api-prod.rateo.ng`. Everything is same-origin.

```
browser ──axios(baseURL '/api')──▶ /api/[...path]  ──fetch + Bearer──▶ API_BASE_URL/<path>
RSC     ──serverFetch()───────────────────────────────────────────────▶ API_BASE_URL/<path>
```

1. **`src/app/api/[...path]/route.ts`** (logic in `src/lib/api/proxy.ts`) is a catch-all that
   forwards `GET/POST/PUT/PATCH/DELETE/OPTIONS` upstream. It forwards only
   `content-type`, `accept`, `content-length`, `accept-language`, `x-requested-with` plus
   `x-forwarded-for`, never the `cookie` header, and adds
   `Authorization: Bearer <rateo_token>` when the cookie exists. Request bodies are streamed
   (`duplex: 'half'`), so multipart uploads pass straight through. Upstream responses are
   streamed back with only `content-type`, `content-disposition`, `cache-control`, `etag` and
   `location` copied — `set-cookie` and hop-by-hop headers are dropped. Network failure
   upstream returns `502 { message: 'Upstream unavailable' }`.

2. **Token capture.** On a 2xx from `auth/login`, `auth/register`, `auth/social-login`,
   `auth/google`, `auth/verify-email` or `auth/refresh-token`, the proxy pulls `token` out of
   the JSON body, sets it as an httpOnly cookie, and returns the body **without** the token.
   The JWT is therefore never readable from JavaScript.

   | Cookie | httpOnly | Contents |
   |---|---|---|
   | `rateo_token` | yes | Backend JWT, 30 days, `SameSite=Lax`, `Secure` in prod, path `/` |
   | `rateo_role` | yes | `individual` or `company`, for route/layout branching |

3. **`proxy.ts` at the repo root** is Next 16's replacement for `middleware.ts`. When both
   Clerk keys are set the guard runs inside `clerkMiddleware()` (so `/sso-callback` and
   `/api/auth/social-login` see the Clerk session); otherwise the bare guard is the default
   export. Either way it checks cookie *presence* only — it never decodes or verifies the JWT. No token on `/dashboard*` or
   `/setup*` redirects to `/login?next=<path>`; a token on `/login`, `/register`,
   `/register/company` or `/forgot-password` redirects to `/dashboard`. `/verify` stays
   reachable while signed in, because that is where the emailed 5-digit code is submitted.

4. **Session endpoints.** `POST /api/auth/logout` expires both cookies (static route files win
   over the catch-all, so it never reaches the backend). `GET /api/auth/session` answers
   `{ authenticated, role }` from cookies alone.

5. **Social sign-in (Clerk).** The provider buttons call `signIn.sso()` and come back to
   `/sso-callback`, which finishes the Clerk flow (`finalize` / `transfer`, always with
   `navigate: async () => {}` so nothing navigates early) and then posts to
   **`POST /api/auth/social-login`** — our own route handler, deliberately not the `/api`
   catch-all. Clerk is only an identity provider here; the app itself runs on the backend JWT.

   That handler reads the signed-in Clerk user server-side with `currentUser()`, so a
   client-supplied email can never be trusted. It builds
   `{ email, firstName, lastName, avatar, role?, companyName? }` — names via the mobile
   `extractClerkName` fallback in `src/lib/clerk-name.ts`, since Apple only shares the name on
   the first authorization — calls the backend `POST /auth/social-login`, moves `token` into
   the httpOnly cookies and returns the body without it. The client then signs OUT of Clerk
   with `redirectUrl` = `/setup` when `setupCompleted === false`, else the safe `next` param or
   `/dashboard`. `role` / `companyName` ride across the OAuth round-trip in `sessionStorage`
   under `rateo.sso`; the backend only honours them when creating a new account.

6. **Expiry.** The axios response interceptor in `src/lib/api/client.ts` treats a 401 from any
   non-auth endpoint as an expired session: it calls the logout route once (bursts are guarded
   by a module flag) and hard-navigates out of `/dashboard` or `/setup` to
   `/login?next=<path>`. 401s from login / register / password-reset paths are left alone —
   those mean "wrong credentials", not "session gone".

## Folder map

```
proxy.ts                        route guard (Next 16 middleware)
next.config.ts                  image remote patterns, .well-known headers
public/.well-known/             apple-app-site-association, assetlinks.json
src/
  app/
    api/[...path]/route.ts      catch-all REST proxy -> API_BASE_URL
    api/auth/logout/route.ts    clears session cookies
    api/auth/session/route.ts   { authenticated, role } from cookies
    api/auth/social-login/      Clerk -> Rate'O session exchange (reads currentUser())
    robots.ts, sitemap.ts
    (public) (auth) (dashboard) route groups + pages
  components/                   UI, shadcn primitives in components/ui
    auth/                       auth pages: forms, OTP, password checklist, social buttons
  providers/                    React context / QueryClientProvider
  hooks/                        TanStack Query hooks (use-jobs, use-companies, use-me)
  services/                     one file per backend domain
    params.ts                   shared query-string builders
    jobs.ts / jobs.server.ts    client (axios) and RSC (serverFetch) variants
    companies.ts / companies.server.ts
    auth.ts, users.ts           client only
  lib/
    env.ts                      getApiBaseUrl(), getAppUrl()
    session.ts                  cookie names, Role, getServerSession(), cookie helpers
    api/client.ts               browser axios instance (baseURL '/api') + 401 handling
    api/server.ts               serverFetch(), getCurrentUser(), absoluteUrl()  [server-only]
    api/proxy.ts                proxyRequest() — the catch-all's implementation
    api/errors.ts               ApiError, getApiErrorMessage()
    auth-error.ts               authErrorMessage() — adds the 429 "too many attempts" copy
    clerk.ts                    clerkEnabled / clerkServerEnabled() / SSO intent helpers
    clerk-name.ts               extractClerkName() ported from the mobile app
    password.ts                 PASSWORD_RULES, isPasswordValid(), zod field
  types/api.ts                  hand-written mirrors of docs/API_CONTRACT.md
```

Services come in two flavours because `src/lib/api/server.ts` imports `server-only`, which must
never reach a client bundle. Use `jobsService` / `companiesService` (axios, `/api`) in client
components and hooks; use `jobsServer` / `companiesServer` (`serverFetch`) in server components,
route handlers and `sitemap.ts`.

## Outstanding TODOs

- **`public/.well-known/apple-app-site-association`** — replace the literal `TEAMID` in
  `"TEAMID.com.rateoapp"` with the Apple Developer **Team ID** (Apple Developer portal →
  Membership). Universal Links for `/jobs/*` and `/companies/*` will not work until then.
- **`public/.well-known/assetlinks.json`** — replace `TODO_SHA256_FINGERPRINT` with the release
  keystore's SHA-256 certificate fingerprint (`eas credentials`, or
  `keytool -list -v -keystore <release.jks>`). Package name is already `com.rateo.mobile`.
- Both files must be served as `application/json`; `next.config.ts` sets that header.
- Clerk keys are empty in `.env.local`; add them (Clerk dashboard → API keys, same instance as
  the Expo app) to turn the social buttons on, and register
  `https://app.rateo.ng/sso-callback` as an allowed redirect.

## Deploying to Vercel

- Framework preset: Next.js. Build `npm run build`, no custom output directory.
- Project → Settings → Environment Variables (Production **and** Preview):
  - `API_BASE_URL = https://api-prod.rateo.ng/api` — plain env var, **not** prefixed
    `NEXT_PUBLIC_`.
  - `NEXT_PUBLIC_APP_URL = https://app.rateo.ng` (use the preview URL for Preview if OG links
    matter there).
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` from Phase 3 onward.
- Domain: add `app.rateo.ng` in Vercel and point the DNS `CNAME` at Vercel. Keep `rateo.ng` on
  Framer; add Framer redirects for `rateo.ng/login`, `rateo.ng/jobs/:id` and
  `rateo.ng/companies/:id` to the matching `app.rateo.ng` path.
- Add `https://app.rateo.ng` to Clerk's allowed origins/redirect URLs when Phase 3 lands.
- The backend currently runs open CORS; restricting it to `app.rateo.ng` and `admin.rateo.ng`
  is a Phase 6 server task and will not affect this app, which is same-origin.

## Do not

- **Do not** put the backend URL in a `NEXT_PUBLIC_` variable, or anywhere in client code.
- **Do not** call `https://api-prod.rateo.ng` from the browser. Use the axios instance from
  `src/lib/api/client.ts` (`baseURL: '/api'`).
- **Do not** import `@/lib/api/server` or any `*.server.ts` service from a client component.
- **Do not** read or write the auth token from JavaScript — it is httpOnly by design. Ask
  `GET /api/auth/session` whether a session exists.
- **Do not** store the session in `localStorage` (that is what `admin-rateo` does; it is not the
  pattern here).
- **Do not** hard-code hex colours in components; use the tokens in `src/app/globals.css`.
- **Do not** commit `.env.local`, and do not commit or push from an agent session.
