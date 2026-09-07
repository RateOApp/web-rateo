# Backend contract (server-rateo) as consumed by web-rateo

Source of truth: `server-rateo/src/routes/*` and `src/controllers/*`. Swagger UI at
`https://api-prod.rateo.ng/api/docs` (spec at `/api/docs.json`) is partly stale; the route
files win.

## Transport

- Base: `https://api-prod.rateo.ng/api` (server-only env `API_BASE_URL`). The browser never
  calls it; every client call goes to the same-origin `/api/...` proxy route handler.
- Auth: `Authorization: Bearer <jwt>`. JWT payload is `{ id }` only (no role), 30-day expiry.
  `GET /auth/refresh-token` (protected) returns `{ token }` with a fresh 30-day token.
- Envelope: **flat objects, no `{ success, data }` wrapper**. Errors are `{ message: string }`
  (register/reset-password may add `errors: string[]` for password-policy violations).
- 401 bodies: `{ message: 'Not authorized, no token' | 'Not authorized, token failed' |
  'Not authorized, user not found' | 'Account no longer exists' }`. 403 `{ message: 'Account
  suspended' }`. KYC gate 403 `{ message: 'Your KYC must be approved before you can use this
  feature' }`. Participation lock 403 `{ code: 'PARTICIPATION_OVERDUE', ... }`.
- Pagination: `?pageNumber=1` (1-based), page size fixed at 10 server-side, response carries
  `page` and `pages` (jobs also `totalCount`). No `limit` param is honoured.
- Uploads: multipart via multer to Cloudinary. Field names: `POST /upload` -> `file`;
  `POST /users/avatar` -> `image`; `POST /users/:userId/resume` -> `resume`;
  `POST /messages/upload` -> `image`.
- CORS is currently `cors()` open; sockets have no auth (Phase 6 fixes both).

## Auth

| Call | Body | 2xx response |
|---|---|---|
| `POST /auth/login` | `{ email, password }` | `{ _id, publicId, firstName, lastName, email, role, companyName, industry, companySize, description, avatar, isOg, kycStatus, setupCompleted, token, deletionCancelled? }` |
| `POST /auth/register` | individual: `{ firstName, lastName, email, password, role:'individual', phone?, location? }`; company: `{ email, password, role:'company', companyName, industry, description?, phone?, location? }` | 201 `{ _id, publicId, firstName, lastName, companyName, industry, companySize, description, avatar, email, role, isOg, token }` and sends a 5-digit email code |
| `POST /auth/social-login` | `{ email, firstName, lastName, avatar, role }` (role only matters for new accounts) | 200 login shape, or 201 `{ _id, firstName, lastName, email, role, companyName, avatar, isOg, setupCompleted, token }` |
| `POST /auth/verify-email` (auth) | `{ code }` | user shape incl. `isVerified`, `token` |
| `POST /auth/resend-verification` (auth) | – | `{ message }` |
| `POST /auth/forgot-password` | `{ email }` | `{ message }` |
| `POST /auth/verify-reset-code` | `{ email, code }` | `{ message:'Code verified' }` |
| `POST /auth/reset-password` | `{ email, code, newPassword }` | `{ message }` |
| `POST /auth/change-password` (auth) | `{ currentPassword, newPassword }` | `{ message }` |
| `GET /auth/profile` (auth) | – | `{ _id, publicId, firstName, lastName, email, role, companyName, industry, companySize, description, website, location, phone, phone_number, avatar, isOg, emailEditRequest, isEmailEditable, phoneEditRequest, isPhoneEditable, setupCompleted }` (**no kycStatus**) |
| `GET /auth/verify-token` | – | `{ valid:true, user:<full User> }` or `{ valid:false, message }` |
| `GET /auth/refresh-token` (auth) | – | `{ token }` |
| `PUT /users/profile` (auth) | role-specific profile fields | updated user |

Token-issuing paths (the proxy must capture `token` and set the cookie):
`auth/login`, `auth/register`, `auth/social-login`, `auth/google`, `auth/verify-email`,
`auth/refresh-token`.

Roles: `'individual' | 'company'` only. Admins are a different model and never log in here.

## Public read endpoints (no auth)

- `GET /jobs?pageNumber=&keyword=&categories=` — `optionalProtect`. `keyword` regex-matches
  `title` only. `categories` is a comma list of industries or `all`. **When the param is absent
  and the caller is a logged-in individual the server personalises from their jobPreferences**,
  so public pages must always send `categories=all` (or the chosen list). Response:
  `{ jobs: Job[], page, pages, totalCount, categories: string[] }`. Jobs are a merge of native
  jobs (`isImported:false`, `company` populated with `companyName avatar location isClaimed
  claimStatus`) and imported jobs (`isImported:true`, `salary` string, `employmentType`,
  `interestCount`, no PII).
- `GET /jobs/categories` — `{ categories: [{ industry, count }] }`.
- `GET /jobs/:id` — native Job (company populated with `companyName avatar location isClaimed
  claimStatus description website`) or imported job shape plus `expectationCopy`. 404
  `{ message:'Job not found' }`.
- `GET /jobs/user/:userId` — `{ jobs }` recommendations, limit 50.
- `GET /users?role=company&keyword=&pageNumber=` — company directory. Response
  `{ users: User[], page, pages }`; each user carries `overallRating`, `participationScore`,
  `participationStatus`. Same endpoint with `role=individual` is the candidate directory.
- `GET /users/:id` — public profile (individual or company). Full User doc minus password,
  plus normalised `kyc: { status:'approved'|'pending'|'rejected'|'unverified', ... }` and, for
  companies, `contractEndSummary: { noticeCount, immediateCount }`. 404 when deleted.
- `GET /reviews/:userId` — reviews about that user/company. Array (sometimes
  `{ reviews: [] }`; handle both). Review: `{ _id, rating, comment, details: Record<string,
  number>, createdAt, isCurrentEmployee, reviewer? }`.
- `GET /participation/:userId` (auth) — participation score/history.
- `GET /faqs`, `GET /app-config`, `GET /countries`, `GET /countries/:cc/states`,
  `GET /countries/:cc/states/:sc/cities`.

Note: `GET /company/:id` and `GET /entities` are **admin-only** despite their names. Do not use
them from the web app.

## Authenticated endpoints used later (Phases 4-6)

Jobs: `POST /jobs`, `PUT/DELETE /jobs/:id`, `POST/DELETE /jobs/:id/apply`,
`POST/DELETE /jobs/:id/save`, `GET /jobs/user/saved`, `GET /jobs/user/applied`,
`GET /jobs/company/myjobs`, `GET /jobs/:id/applicants`,
`PUT /jobs/:id/applicants/:applicantId { status }`, `POST /jobs/:id/report { reason, details }`,
`POST /users/jobs/:id/block`, `POST /imported-jobs/:id/interest`.

Users: `POST /users/avatar`, `POST /users/search { query }`, `POST /users/search-companies
{ query }`, `POST /users/request-company { companyId }`, `GET /users/saved`,
`POST/DELETE /users/:id/save`, `POST/DELETE /users/:id/block`, `POST /users/:id/report`,
`GET /users/:id/full`, `GET /users/:userId/work-history`, `GET/POST/DELETE
/users/:userId/resume`, `GET /users/candidates`, company employee endpoints under
`/users/company/employees*`, employment endpoints under `/users/employment/*`,
`GET/PUT /users/company/preferences`, email/phone change flows under `/users/email/*` and
`/users/phone/*`, `DELETE /users/:id`.

KYC: `POST /users/kyc` (manual), `POST /users/kyc/attestation`,
`POST /users/kyc/dojah/init { flow }` -> `{ appId, publicKey, widgetId, referenceId, userData,
metadata }`, `POST /users/kyc/dojah/confirm`, `POST /users/kyc/dojah/cancel`.

Reviews: `POST /reviews`, `GET /reviews/status/monthly`. Notifications: `GET /notifications`,
`PUT /notifications/:id/read`, `PUT /notifications/read/all`, `DELETE /notifications/:id`.
Messages: `GET /messages/conversations`, `GET /messages/unread-count`, `GET /messages/:userId`,
`POST /messages { receiverId, content, replyTo, attachments }`, `PUT /messages/read/:senderId`,
`PUT/DELETE /messages/:id`, `POST /messages/:id/react { emoji }`, `POST /messages/:id/report`.
Support: `GET/POST /support/tickets`, `GET /support/tickets/:id`,
`POST /support/tickets/:id/messages`. Invitations: `POST /invitations/company { email,
companyName }`. Participation: `GET /participation/status`.

Socket (Phase 6): `io('https://api-prod.rateo.ng', { transports:['websocket'] })`, emit
`join_room` with `user_<id>`; events `kyc_updated`, `new_message_notification`,
`account_status_changed`, plus chat events.

## Schemas (fields the web app renders)

Job:
```
_id, title, type ('Full time' ...), workArrangement ('Remote'|'Hybrid'|'On-site'), location,
category (industry), genderPreference ('any'|'male'|'female'), skills[], minSalary, maxSalary,
description, tasks[], perks[], deadline (ISO), minRating, status ('open'|'closed'),
company: { _id, companyName, avatar, location, isClaimed, claimStatus, description?, website?, isOg? },
applicants: [{ applicant, status, appliedAt }], createdAt, updatedAt,
isImported (false)
// imported job variant: isImported:true, title, companyName, salary (string), employmentType,
// location, description, interestCount, expectationCopy (detail only), sourceUrl?
```

User (both roles):
```
_id, publicId, role, email, avatar, location, phone, kycStatus ('none'|'pending'|'verified'|'rejected'),
isOg, setupCompleted, participationScore, participationStatus, createdAt,
// individual
firstName, lastName, gender, bio, skills[], experience[{ title, company, companyId, startDate,
endDate, current, description }], education[], jobPreferences { categories[], jobTitle, location,
minSalary, maxSalary, minRating }, resume, savedJobs[], jobTitle (derived)
// company
companyName, industry, companySize, website, description, candidatePreferences, isClaimed,
claimStatus, overallRating (listing), contractEndSummary (detail)
```

Rating criteria for companies (keys in `review.details`): Salary, Career Growth, Management,
Work Environment, Fairness (legacy keys may exist; treat unknown keys as extra rows).
