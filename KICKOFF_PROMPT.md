# Rateo web app — new session kickoff prompt

Paste everything below the line into a fresh Claude Code session opened in
`C:\Users\USER\Desktop\Rateo-company\web-rateo`.

---

I am building the Rate'O web app in this empty folder (`web-rateo`). It is a sibling
of three existing repos in `C:\Users\USER\Desktop\Rateo-company`:

- `server-rateo` — Express 5 + Mongoose + socket.io backend, prod at `https://api-prod.rateo.ng/api`.
  Auth is a stateless JWT sent as `Authorization: Bearer`. Social login is `POST /auth/social-login`
  with `{ email, firstName, lastName, avatar, role }` from a Clerk profile. Swagger at `/api/docs`.
  `GET /api/jobs/:id` and `GET /api/company/:id` are public. CORS is currently open to all origins.
- `new-rateo/app-rateo` — the Expo mobile app (JS, React Navigation, TanStack Query, axios, Clerk Expo).
  It is the feature reference: ~68 screens in `src/screens`, API calls in `src/services`, socket in
  `src/lib/socket.js`, auth in `src/context/AuthContext.js`, colours in `src/constants/colors.js`,
  font Plus Jakarta Sans. Two roles: individual and company. Individual tabs are
  Home, Explore, Ratings, Saved, Profile. Company tabs are Home, Explore, Ratings, Candidates, Profile.
- `admin-rateo` — Next 16 App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query, axios.
  Use it as the stack and folder-structure reference, but do NOT copy its localStorage auth or its
  duplicated AuthRedirect components.

## Product decisions (already made, do not re-litigate)

- The marketing site `rateo.ng` stays on Framer. This app is hosted at `https://app.rateo.ng`.
  Framer buttons will link to `app.rateo.ng/login`; Framer redirect rules will forward
  `rateo.ng/login` and `rateo.ng/jobs/:id` to the app.
- Stack: Next 16 App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query, axios,
  socket.io-client, `@clerk/nextjs` for Google/Apple/LinkedIn (same Clerk instance as mobile).
- The browser must never call `api-prod.rateo.ng` directly. All REST goes through a catch-all
  route handler `app/api/[...path]/route.ts` that forwards to the backend server-side, adds the
  bearer token from an httpOnly cookie, and streams multipart uploads through. Login and
  social-login handlers set that cookie. `middleware.ts` guards the protected route groups.
- Route groups: `(public)` for `/jobs`, `/jobs/[id]`, `/companies`, `/companies/[id]`, `/search`;
  `(auth)` for `/login`, `/register`, `/register/company`, `/forgot-password`, `/verify`;
  `(individual)` and `(company)` for the dashboards under `/dashboard/...`, picked by the user's
  role after login. Setup wizards run at `/setup` when `setupCompleted` is false.
- Layout: desktop = top nav + content column; mobile web = same five bottom tabs as the app.
- Colours and fonts: use `design/DESIGN_TOKENS.md` in this folder. It carries the official Figma
  brand palette (`#113D3C`, `#005C5A`, `#FC9D01`, `#FEB336`, `#FFF5E1`) and the mapping to the
  mobile app's slightly drifted values. Figma wins over mobile. `design/brand-colours.png` is the
  guideline page itself. Wire the palette as CSS variables plus Tailwind theme colours; never
  hard-code hex in components.
- Public job and company pages are server-rendered with Open Graph / Twitter metadata so shared
  links show rich previews. Serve `/.well-known/apple-app-site-association` and
  `/.well-known/assetlinks.json` from `public/` (iOS bundle `com.rateoapp`, Android package
  `com.rateo.mobile`; leave TODO placeholders for team id and SHA-256 fingerprint).
- Hosting target: Vercel. Env var `API_BASE_URL` (server-only, not NEXT_PUBLIC) for the backend,
  `NEXT_PUBLIC_APP_URL=https://app.rateo.ng`, plus Clerk keys.
- Native features map to web like this: image/document pickers -> file inputs; resume download ->
  direct link; Dojah KYC -> the same hosted `identity.dojah.io` widget URL in an iframe or redirect,
  driven by `POST /users/kyc/dojah/init`; PDF viewer -> browser native; swipe deck -> card list
  with Like / Pass buttons; push notifications -> in-app bell only for now; no version gate.

## Phases

1. Foundation: scaffold, tokens, shadcn, query client, API proxy + cookie auth, middleware,
   app shell with both layouts, robots + sitemap, `.well-known` files, README with env setup.
2. Public pages + share links: jobs list/detail, companies list/detail, search, OG metadata.
3. Auth + onboarding: login, both registrations, Clerk social, OTP verify, forgot/reset,
   role select, individual and company setup wizards.
4. Individual dashboard: feed, apply, saved, my jobs, profile + bio + skills, work history,
   resume, job preferences, KYC (Dojah + manual), ratings dashboard + monthly rating flow,
   notifications, settings, change password, help/FAQ, report problem, request company.
5. Company dashboard: post/edit/update job, applications, applicant detail, candidates,
   candidate preferences, explore talent, manage employees, company KYC, ratings flow,
   profile edit, notifications.
6. Realtime: messages, chat, support chat. Server prerequisite: add JWT auth to the socket
   handshake in `server-rateo/src/index.js` and restrict CORS to app.rateo.ng and admin.rateo.ng.

## Working rules for this session

- Start with Phase 1 and Phase 2 only. Before writing code, read the relevant mobile screens and
  `src/services` files so the web calls the same endpoints with the same payload shapes.
  Check `server-rateo/src/routes` and controllers when a payload is unclear.
- Plan first, then delegate building to sub-agents and QA the result yourself: run `npm run build`,
  `npx tsc --noEmit`, and open the pages in a browser.
- Do not commit or push. Tell me what to commit at the end of each phase.
- Never put the backend URL in a `NEXT_PUBLIC_` variable or in client code.
- When done with a phase, give me a short checklist of anything I must do outside the code
  (Vercel project, DNS for app.rateo.ng, Framer redirects, Clerk allowed origins, Apple Services ID).

Begin by confirming you can read the three sibling repos, then propose the Phase 1 file tree
before scaffolding.
