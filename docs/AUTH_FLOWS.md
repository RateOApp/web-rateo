# Auth and onboarding flows (ported from app-rateo)

Facts below come from the mobile screens and `server-rateo` controllers. Web mirrors the
payloads and validation exactly; UI is adapted to the browser.

## Password policy (server, `passwordValidator.js`)

Applied on register, reset-password, change-password. Not on login.
- at least 8 characters, at most 128
- at least one uppercase, one lowercase, one digit
- not in the common list (`password`, `12345678`, ...)
- reset/change reject reusing the current password ("You have used this password before...")
Server error shape: `400 { message: errors[0], errors: string[] }`.

## Login `POST /auth/login { email, password }`

- Mobile does presence checks only. Web: email format + non-empty password.
- 401 `{ message: 'Invalid email or password' }`, 403 `{ message: 'Account suspended' }`,
  429 from the limiter (5 attempts / 15 min / IP) — show "Too many attempts, try again later".
- Response (token already moved to the cookie by the proxy): `setupCompleted`, `role`, ...
- After login: `setupCompleted === false` → `/setup`, else `next` param (must start with a
  single `/`) or `/dashboard`. Use a full navigation (`window.location.assign`) so server
  components re-render with the new cookie.
- Email verification is NOT enforced at login by the backend; do not block on it.

## Register

Individual `POST /auth/register`:
```
{ firstName, lastName, email, password, phoneNumber: '+234…' | '', role: 'individual' }
```
Company `POST /auth/register`:
```
{ companyName, email, password, phoneNumber, role: 'company' }
```
- Phone is optional. Country picker default Nigeria `+234`; list: NG +234, GH +233, KE +254,
  ZA +27, US +1, GB +44, CA +1, IN +91. Send dial code + digits only when a number is typed.
- Client checks (same messages as mobile): names required; email required; password and
  confirm required; "Passwords do not match"; "Please meet all the password requirements
  listed below the password field."
- Live password checklist: 8+ chars, uppercase, lowercase, number (matches server).
- 400 `{ message: 'User already exists' }`.
- 201 response includes `token` (proxy captures it → cookies set) and the server emails a
  5-digit code (15 min expiry). Then go to `/verify?email=<email>&mode=signup`.

## Email verification `/verify`

- 5 single-digit inputs, auto-advance, paste support. "Check your email" / "We've sent a
  code to {email}".
- Signup mode: `POST /auth/verify-email { code }` (cookie auth). Resend:
  `POST /auth/resend-verification`. Resend disabled for 59 s ("Resend code in 00:37"), then
  "Send code again". Success → `/setup`.
- Reset mode (`mode=reset`): `POST /auth/verify-reset-code { email, code }`. Resend re-calls
  `POST /auth/forgot-password { email }`. Success → `/reset-password?email=&code=`.
- Errors: 400 `{ message: 'Code is required' | 'No active verification request' |
  'Code expired' | 'Invalid code' }` and for reset `'Invalid or expired code'`.

## Forgot / reset password

- `/forgot-password`: email (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`), copy "Forgot Password?" /
  "Please enter your email address and we'll send you a code." Button "Reset Password".
  `POST /auth/forgot-password { email }` → 200 `{ message }`, 404 `'No account found with
  that email'`. Then `/verify?email=&mode=reset`.
- `/reset-password?email=&code=`: "Set new password" / "Create a new password for your
  account. It must be at least 8 characters." New + confirm with checklist.
  `POST /auth/reset-password { email, code, newPassword }` → 200 `{ message }`. Success view:
  "Password Changed Successfully!" + "Back to Sign In" → `/login`.

## Social login (Clerk: `oauth_google`, `oauth_apple`, `oauth_linkedin_oidc`)

Web flow (server-side exchange; never trust a client-supplied email):
1. Button calls `signIn.sso({ strategy, redirectCallbackUrl: '/sso-callback?role=…&next=…',
   redirectUrl: same })` from `useSignIn()` (`@clerk/nextjs`). `role` is `company` on
   `/register/company`, `individual` on `/register`, absent on `/login`.
2. `/sso-callback` (client) follows Clerk's custom-flow callback: `signIn.status ===
   'complete'` → `signIn.finalize()`; `signUp.isTransferable` → `signIn.create({ transfer:
   true })`; `signIn.isTransferable` → `signUp.create({ transfer: true })` then
   `signUp.finalize()`; `existingSession` → `clerk.setActive`. Do not navigate in `finalize`;
   pass `navigate: async () => {}` so the page stays.
3. Then `POST /api/auth/social-login { role?, companyName? }` (our own route handler, not
   proxied). The handler reads the Clerk user with `currentUser()` from
   `@clerk/nextjs/server`, builds `{ email, firstName, lastName, avatar, role, companyName }`
   with the mobile `extractClerkName` fallback (firstName || fullName first word ||
   externalAccounts[0].firstName), calls backend `POST /auth/social-login`, sets the session
   cookies from the response `token`/`role`, and returns the body without `token`.
4. Client signs out of Clerk (`clerk.signOut({ redirectUrl })`) with `redirectUrl` =
   `/setup` when `setupCompleted === false`, else `next` or `/dashboard`.
- Backend: existing user → 200 login shape; new user → 201 with `setupCompleted: false`,
  role from the request (default individual), `companyName` if sent.
- Clerk keys absent (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` empty): hide the social buttons,
  skip `ClerkProvider`, and run the plain cookie guard in `proxy.ts`. The build must pass
  without keys.

## Setup wizards `/setup` (`PUT /users/profile`, only fires `setupCompleted` when `=== true`)

Individual (3 steps, progress "1 of 3"):
1. Name (only when `!lastName && (!firstName || firstName === 'User' || firstName ===
   emailPrefix)`) + Job title (free text with suggestions from the 28-title list). Errors:
   "Please enter your first and last name." / "Please enter your job title to continue."
2. Location select: "I'm open to work anywhere" (default), "Remote", then the 36 states and
   "FCT - Abuja".
3. Company: search-as-you-type (250 ms debounce) against `GET /users?role=company&keyword=`;
   pick a suggestion (sets `companyId`) or tick "I'm currently not employed" (sets company to
   the literal `Currently Unemployed`). If typed but not matched: offer "Send invite" dialog
   (company email, `POST /invitations/company { email, companyName }`). Confirm dialog
   ("Confirm Company Selection" / "cannot be changed after confirmation").
   Note under the field: "By continuing, you agree for us to send your profile to your
   company for confirmation."
Payload:
```
{ location, experience: [{ title, company, companyId?, current: true, startDate: new Date() }],
  setupCompleted: true, firstName?, lastName? }
```

Company (4–5 steps):
0. Company name (only when empty). Required.
1. Industry: combobox limited to the 31-entry list (exact match). Errors "Please select your
   industry to continue." / "Please pick your industry from the list."
2. Logo: file input (jpg/png/webp) → `POST /users/avatar` multipart field `image` →
   `{ avatar }`. Skipping asks "Continue without logo?".
3. Address: required free text.
4. About us: textarea, max 500, placeholder "Feel free to include details about what the
   company does, its core values and what set it apart." Required.
Payload: `{ companyName, industry, address, description, avatar?, setupCompleted: true }`.

After finishing either wizard: full navigation to `/dashboard`.

## Lists

Industries (31, exact strings, also used for job categories):
Agriculture & Farming, Animal Care & Veterinary, Automotive, Banking & Financial Services,
Construction & Real Estate, Consulting & Professional Services, Creative Arts & Design,
Education & Training, Energy & Utilities, Engineering & Manufacturing, Entertainment & Media,
Environmental & Waste Management, Fashion & Beauty, Food & Beverage, Government & Public Sector,
Healthcare & Pharmaceuticals, Hospitality & Tourism, Human Resources & Recruitment,
Information Technology & Software, Insurance, Legal Services, Logistics & Transportation,
Marketing & Advertising, Mining & Metals, Non-Profit & NGO, Oil & Gas, Retail & E-commerce,
Security Services, Sports & Recreation, Telecommunications, Other

Job titles (28): Software Engineer, Frontend Developer, Backend Developer, Full Stack
Developer, Mobile Developer, Software Architect, Data Scientist, Data Analyst, Data Engineer,
DevOps Engineer, QA Engineer, Product Manager, Project Manager, Product Designer, UI/UX
Designer, Graphic Designer, Designer, Marketing Manager, Digital Marketer, Content Writer,
Sales Executive, Business Analyst, Business Development Manager, Accountant, Financial
Analyst, Human Resources Manager, Customer Support Specialist, Operations Manager

Company sizes (profile edit, later): Small (1 - 10 employees), Medium (20 - 50 employees),
Large (50 - 200 employees), Enterprise (200+ employees).
Genders (profile edit, later): Male, Female, Other, Prefer not to say.
Nigerian states: Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross
River, Delta, Ebonyi, Edo, Ekiti, Enugu, Gombe, Imo, Jigawa, Kaduna, Kano, Katsina, Kebbi,
Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba,
Yobe, Zamfara, FCT - Abuja.
