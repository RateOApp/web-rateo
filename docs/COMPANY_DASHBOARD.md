# Company dashboard (Phase 5) — spec ported from app-rateo

Facts come from the mobile company screens and server-rateo controllers. Payloads, gates and
copy must match; layout adapts to the browser. Shared rules from `INDIVIDUAL_DASHBOARD.md`
apply (useMe, invalidate `['me']` + `router.refresh()`, KycRequiredDialog, ParticipationLockDialog,
rating window). Company KYC dialog's **Start Verification** goes to `/dashboard/kyc`.

## Route plan

Shared pages that branch on role (move from `(individual)` to shared, keep the individual
component): `/dashboard/kyc`, `/dashboard/kyc/dojah`, `/dashboard/profile/edit`,
`/dashboard/profile/bio`. Company-only (under `(company)`): `/dashboard/jobs`,
`/dashboard/jobs/new`, `/dashboard/jobs/[id]/edit`, `/dashboard/jobs/[id]/applicants`,
`/dashboard/candidates` (hub), `/dashboard/talent/[id]` (candidate/employee detail),
`/dashboard/candidate-preferences`, `/dashboard/employees`, `/dashboard/ratings/rate/[employeeId]`.
Shared pages get their company branch: `/dashboard`, `/dashboard/explore`, `/dashboard/profile`,
`/dashboard/ratings`, `/dashboard/notifications` (routing by type).

Public id: companies display `BID-{publicId}`, individuals `ID-{publicId}`.

## A. Home `/dashboard` (company)

- Header: logo avatar, **Hello {companyName}**, OG badge. Message icon → `/dashboard/messages`
  (KYC gate; page arrives in Phase 6, link is fine).
- Participation banner (window and `outstanding > 0`): overdue **Rate your employees — {n}
  left to unlock.**; grace **You missed last month — rate your employees ({n} left) to stay on
  track.**; current **Rate your employees — {n} left. Window closes on the 10th.** →
  `/dashboard/ratings`.
- KYC banner (same component as individual): pending / prompt → `/dashboard/kyc`.
- Rating card (`GET /reviews/:myId`): same tier titles as individual; participation row with
  subtitle copy where the not_established line reads **Not yet established — starts counting
  when you rate your employees.** (others identical). Links `/dashboard/ratings`.
- Quick actions: brand-700 card **Looking for qualified talents?** button **Post a job
  opening** (KYC gate → `/dashboard/jobs/new`); accent card **Let your workers know how they
  are doing!** button **Write a Review** (KYC gate → `/dashboard/employees`).
- Monthly prompt (once per day, `localStorage` `ratingPromptSeen-{id}-{date}`, only when
  verified and `GET /reviews/status/monthly` → `shouldPrompt`): **Time to rate your
  employees** / **Its time for your monthly rating. Please note that you won't be able to
  swipe on talents without completing your rating.** Buttons **Rate now** (→
  `/dashboard/ratings`) / **Maybe later**.
- Pending employee claims (`GET /users/company/employees` → `requests[]`): card **{name}**
  **says they're part of your company** with **Yes, confirm** / **Reject** →
  `POST /users/company/employees/:id/verify { action: 'approve'|'reject' }`.
- **Top candidates for you**: feed `GET /users?role=individual&pageNumber=` (paged). Client
  match (`src/lib/candidate-match.ts`): skills vs `candidatePreferences.roles` 40 %, location
  25 %, `minRating` 20 %, title text 15 %. Card: avatar, name (link `/dashboard/talent/[id]`,
  OG badge), title (current experience title or **Job Seeker**), stars, up to 3 skill chips
  + `+N` (or **No skills listed yet**), **{match}% Match**, Pass / Like. Like (KYC gate) →
  check `['savedCandidates']` cache → `POST /users/:id/save` → toast **Candidate saved**
  (`/already/i` → **Candidate already saved**). Pass = local dismiss. Empty **No more
  candidates in this batch** / **You've swiped through all available candidates for now.
  Check back later or post a new job to attract more talent.** Error **Something went wrong**
  / **We couldn't load candidates. Check your connection and try again.** + **Retry**.

## A. Explore `/dashboard/explore` (company)

- Banner when unverified: **Please complete KYC for full exploration.** Cards dimmed
  (`opacity-50`), clicks open KycRequiredDialog.
- Search **Search for roles & people** → suggestions `GET /users?role=individual&keyword=`
  (≥2 chars, top 5: avatar, **{name} • {title}**, `ID-xxxxxx`), header **Search
  suggestions**, **No matches found**. Submit → results on the same page (`?q=`): **Search
  results for: {q}**, rows with avatar, name, title, rating star, message icon (→
  `/dashboard/messages?user=` KYC gate), empty **No candidates found matching "{q}"**.
- **Top rated talents**: top 3 by `compareTopRated`; card avatar, name, title, rating,
  participation ring + chip or **Not yet established**. Empty **No top talents available** /
  **There are currently no top-rated talents to display.**
- Talent list (rest, paged): avatar, name, title, rating. Empty **No talents found** / **There
  are currently no talents to display.** Links → `/dashboard/talent/[id]`.

## A. Candidates hub `/dashboard/candidates`

Tabs **Manage applications** and **Saved talents** (`?tab=`).
- Manage applications: `GET /jobs/company/myjobs` (array or `{ jobs }`). Card: title,
  **₦{minSalary}/month** or **Negotiable**, **{n} Applicants** pill, **Deadline: {date}** or
  **No deadline**, delete icon → dialog **Are you sure you want to delete?** / **This action
  cannot be undone.** → `DELETE /jobs/:id`. Card → `/dashboard/jobs/[id]/applicants`. Empty
  **You don't have any job posting.** + **Post a job opening** (KYC gate). FAB/button **Post a
  job** → `/dashboard/jobs/new`.
- Saved talents: `GET /users/saved` (bare array; filter out ids in my `blockedUsers`). Card:
  avatar, title, name, rating pill, remove → `DELETE /users/:id/save` → **Removed
  successfully**. Card → `/dashboard/talent/[id]`. Empty **You don't have any saved talents
  yet.** / **Swipe right to save talents faster.** + **Find great candidates** →
  `/dashboard/explore`.

## A. Talent detail `/dashboard/talent/[id]?job=&from=`

Data: `GET /users/:id`, `GET /users/:id/resume`, `GET /users/saved` (isSaved), `GET
/reviews/:id`, `GET /participation/:id`. `isEmployee` = `experience` has `companyId === myId
&& current` (or `?employee=1`).
- Title **Employee profile** / **Talent details**. Summary: avatar, name (+OG), `ID-xxxxxx`,
  title, rating, save heart (KYC gate; `POST`/`DELETE /users/:id/save`).
- ParticipationStatCard; **Rating breakdown** bars (Attendance, Behaviour, Responsibility,
  Skills, Performance from `detailsBreakdown` via `canonicalCriterion`) with ⓘ info dialogs;
  skills chips.
- Actions: employee → **Send message** + **Rate** (window check toast **Rating unavailable**;
  already rated this month → **Already rated** / **You have already rated {name} this month.
  You can rate again next month.**, disabled label **Rated this month**; else →
  `/dashboard/ratings/rate/[id]`), note **You've already rated this staff this month. Rating
  opens again next month.** Non-employee → **Send a message** and, when `?job=` is present,
  **Reject** (confirm **Reject Applicant** / **Are you sure you want to reject this
  applicant?** → `PUT /jobs/:job/applicants/:id { status: 'rejected' }` → **Applicant
  rejected**).
- **Resume**: **View resume** (new tab) + download link, or **No resume uploaded**.
- **Work History**: per `experience` entry: company (or **Not in employment** when no
  companyId), title, dates, resign chip (`endedBy === 'employee'`: **Resigned — gave {n}
  days' notice** / **Resigned — immediate**), latest review from that company: title/stars,
  `commentHidden` → **Feedback hidden — this user hasn't completed their monthly rating.**,
  `isCurrentEmployee` → **Review hidden — revealed when the contract ends.**, else body;
  **View more comments ({n})** opens a dialog list. Empty **No work history available**.
- Overflow menu: **Report Candidate** (dialog **Please provide a reason for reporting this
  candidate.**, placeholders **Reason (e.g. Fake profile, Harassment)** / **Additional details
  (optional)** → `POST /users/:id/report { reason, details }` → **Candidate reported
  successfully**), **Block Candidate** (confirm **Are you sure you want to block this
  candidate? You won't see them in search results anymore.** → `POST /users/:id/block` →
  **Candidate blocked successfully** → back), and for employees **Terminate contract**
  (confirm **Terminate contract?** / **This employee will be moved to Terminated with a 3-day
  recovery window.** → `DELETE /users/company/employees/:id` → toast **Contract terminated** /
  **{name} can be recovered within 3 days.**).

## A. Candidate preferences `/dashboard/candidate-preferences`

`GET /users/company/preferences` → `{ location?, minRating?, roles? }` (defaults Lagos, 2,
[]). **Candidate Location** select [Lagos, Abuja, Port Harcourt, Kano, Ibadan, Remote];
**Minimum applicant rating** 1–5 stars; **Add a role** input **Type a role or skill** + **Add**,
removable chips. **Save Changes** → `PUT /users/company/preferences { location, minRating,
roles }` → **Preferences updated successfully**.

## A. Notifications routing (company)

application → `/dashboard/candidates`; message → `/dashboard/messages` (KYC gate); rating →
`/dashboard/ratings`; kyc, account → `/dashboard/profile`; system, employment →
`/dashboard/employees`; default `/dashboard`.

## B. Jobs

Constants (`src/lib/constants/jobs.ts`): `JOB_TYPES` [Full time, Part time, Contract,
Internship, Freelance]; `WORK_ARRANGEMENTS` [Remote, Hybrid, On-site]; `JOB_LOCATIONS` [Lagos,
Abuja, Port Harcourt, Kano, Ibadan, Enugu, Remote] (+ custom text allowed); `SKILLS_POOL`
[HTML, CSS, Javascript, React Native, React, Node.js, Python, UI Design, UX Design, Project
Management, Agile, SQL, NoSQL, DevOps, Cloud Computing, Communication, Leadership, Problem
Solving] (+ custom); `DEADLINE_OPTIONS` [1 week, 2 weeks, 1 month, 3 months, Indefinite] +
**Pick a specific date**; gender labels Both/Male/Female → any/male/female.

### My jobs `/dashboard/jobs`
`GET /jobs/company/myjobs` (array). Card: title, status badge (**Open** brand / other accent),
**{type} • {workArrangement}**, location, **{n} Applicants**, **Posted {date}**. Card →
`/dashboard/jobs/[id]/applicants`; edit icon → `/dashboard/jobs/[id]/edit`. Empty **You
haven't posted any jobs yet.** + **Post a Job** (KYC gate). Header button **Post a job** (KYC
gate, participation pre-empt).

### Post `/dashboard/jobs/new` (KYC gate + participation pre-empt on submit)
Fields in order: Job title (**e.g. Software Engineer**); Job type; Job industry (searchable
combobox of the 31 industries, default `user.industry`); Work arrangement; Location (select +
custom); Skills (multi-select + custom, chips, default [Communication]); Preferred gender
(helper **Optional — shown on the job listing.**); Min./Max. salary (optional, ₦, placeholders
100,000 / 1,000,000); Application deadline (presets or date ≥ today); Job description
(textarea); Tasks (one per line); Perks (Optional, one per line); Minimum applicant rating
(stars, toggle off → 0, hint **{n}+ stars** / **No minimum — any rating can apply**). Submit
**Post job opening**. Validation: **Please fill in all required fields (Title, Description,
Location)**; **Please choose the job industry.** Deadline: 1 week +7d, 2 weeks +14d, 1 month
+30d, 3 months +90d, Indefinite null. Payload `POST /jobs { title, type, workArrangement,
location, skills, minSalary?, maxSalary?, description, tasks[], perks[], deadline, minRating,
category, genderPreference }`. Success view **Success!** / **Your job opening has been posted.
Applicants will be able to see your posting.** + **Done** → `/dashboard/jobs`.

### Edit `/dashboard/jobs/[id]/edit`
`GET /jobs/:id` prefill; same fields; plus a **Status** toggle Open/Closed (`status`) — server
supports it. Save `PUT /jobs/:id` (same payload + `status`) → **Job updated successfully**.
Delete: **Delete Job** / **Are you sure you want to delete this job? This action cannot be
undone.** → `DELETE /jobs/:id` → **Job deleted successfully** → `/dashboard/jobs`. Validation
as post (do not require salary).

### Applicants `/dashboard/jobs/[id]/applicants`
`GET /jobs/:id` (header: title, salary/month or Negotiable, **Deadline: {date}**, **{n}
Applicants**, edit icon) and `GET /jobs/:id/applicants` → array `[{ _id, applicant: { _id,
firstName, lastName, avatar, skills, resume, overallRating, title }, status, appliedAt }]`.
Filter chips All / Pending / Accepted / Rejected. Row: avatar, name (→ `/dashboard/talent/
[id]?job=[jobId]`), title or **Job Seeker**, rating, and for `pending`: decline (X) →
`PUT /jobs/:id/applicants/:applicantId { status: 'rejected' }` and accept (✓) → participation
pre-empt → dialog **Accept this candidate?** / **You have reviewed this candidate and want to
accept them into your company as an employee.** / **Cancel** / **Yes, accept** → `{ status:
'accepted' }` (403 PARTICIPATION_OVERDUE → lock dialog). Non-pending rows show a status pill.
Optimistic update, invalidate `['jobApplicants', id]`, `['companyEmployees']`. Empty **No
applicants yet**.

## C. Employees `/dashboard/employees`

Tabs **Employees**, **Pending ({n})**, **Terminated ({n})**. `GET /users/company/employees` →
`{ employees: [{ id, name, role, avatar, rating, ratingRequired, notice: { effectiveDate,
noticeDays, givenBy, reason } | null }], requests: [{ ...same, status }] }`; `GET
/users/company/employees/terminated` → `{ terminated: [{ id, name, role, avatar,
terminatedAt, recoveryDeadline, endedBy, endReason, endMethod, noticeDays, recoverable }] }`.
- Employee row: **Rating required** badge, name (→ `/dashboard/talent/[id]?employee=1`),
  **{role} • {rating}★**, **On notice** chip + **Last day {date} · given by you|them**. Row
  menu: **Rate now** (window check; `ratingRequired === false` → toast **Already rated** /
  **You have already rated {name} this month.**; → `/dashboard/ratings/rate/[id]`),
  **Withdraw notice** (only `notice.givenBy === 'company'`; `POST
  /users/company/employees/:id/notice/withdraw` → **Notice withdrawn** / **{name}'s
  employment continues as before.**), **End contract** (dialog below).
- Pending row: **{name} says they're part of your company** + ✓ / ✗ → `POST
  /users/company/employees/:id/verify { action }` → **Request Approved** / **Employee added
  successfully.** or **Request Rejected** / **Request rejected.**
- Terminated row: chips **Resigned** (`endedBy === 'employee'`), **Gave notice · {n}d** /
  **Immediate**; if `recoverable` countdown **Recover within {d}d {h}h** + **Recover** →
  `POST /users/company/employees/:id/recover` → **Employee recovered** / **The employee has
  been reinstated.**; else **Terminated {date}** + reason.
- Empty: **No pending requests** / **No employees yet** / **No terminated employees**.
- End contract dialog: **End contract** / options **Give notice** (**{name} works until the
  chosen date — at least 7 days ahead**; info **The professional way to end a contract.
  Employment continues until the last working day, and the other party is notified today.
  This is recorded on your company profile as 'Gave notice'.**) and **End immediately** (**Ends
  today — cannot be undone**; info **Ends the contract today and cannot be undone. This is
  permanently recorded on your company profile as an immediate ending and affects how others
  see the way you end contracts.**). Notice form: date (today+7 … today+90), reason select
  [Performance, Misconduct, Redundancy/restructuring, End of project, Business closure,
  Others], note (required 3–500 for Others, else ≤500), **Confirm notice**. Immediate form:
  warning **This ends {name}'s employment today and cannot be undone**, reason, note, box
  **This ends the contract today, cannot be undone, and is permanently recorded on your
  company profile.**, **Confirm — end today**. `POST /users/company/employees/:id/end { mode,
  reason, note?, effectiveDate? }` → **Notice given** / **{name} works until {date}.** or
  **Contract ended** / **{name}'s employment has ended today.** Show server errors verbatim.

## C. Ratings `/dashboard/ratings` (company)

Tabs **Company Rating** and **Rate Employees**.
- Company Rating: `GET /reviews/:myId`; feedback card by average — no reviews **No ratings
  yet 🌱** / **Nothing to worry about — your company just hasn't been rated yet. As your staff
  share their experience, your rating will appear here and grow over time.**; 0–1.9 **Uh-oh!
  😐** / **Your company rating is low. Employees feel key areas like career growth, fair pay,
  and duty of care need real improvement.**; 2–2.9 **You're getting there! 👍** / **Staff see
  some effort. Keep working on professionalism, safety, and growth opportunities to build
  trust.**; 3–3.9 **Decent job! 👍** / **Your company is doing okay, but there's room to grow.
  Strengthen weaker areas like salary and career development.**; 4–4.5 **Great job! ⭐** /
  **Employees rate your company highly. Keep investing in growth and staff wellbeing to reach
  excellence.**; 4.6–5 **Outstanding! 🔥** / **Your company is rated excellently across the
  board. Employees value working here — keep it up!** Then logo/name/industry/rating row,
  ParticipationStatCard, bars for Salary, Career Growth, Management, Work Environment,
  Fairness with ⓘ; **How you end contracts** card when `noticeCount + immediateCount >= 1`
  (`GET /users/:myId` → `contractEndSummary`): two-segment bar + **{a}% with notice · {b}%
  immediate ({n} endings)**; reviews list (reviewer name or **User**, date, stars, comment;
  `isCurrentEmployee` → **Review Hidden** + **Still an employee — rating cannot be seen until
  after termination of contract.**). Empty **No reviews yet.**
- Rate Employees: requests (approve/reject as above) and employees with **Rating required**
  badge; row menu **Rate now** (same gates) and **Terminate contract** (confirm **Terminate
  contract?** / **Are you sure you want to terminate contract with this employee?** →
  `DELETE /users/company/employees/:id` — use the real termination endpoint, not the mobile
  `reject` shortcut → **Termination successful**). Empty **No Employees Yet** / **Employees who
  list your company as their current employer will appear here for verification.**

### Rate an employee `/dashboard/ratings/rate/[employeeId]`
Window check; employee from `['companyEmployees']` (fallback `GET /users/:id` for name);
`ratingRequired === false` → **Already rated** and back. Steps Attendance, Behaviour,
Responsibility, Skills, Performance, Comment; question **What would you rate this employee in
terms of {criterion}?**; same UI as the individual flow. `POST /reviews { targetId, rating:
avg, details: { Attendance, Behaviour, Responsibility, Skills, Performance }, comment:
`${title}\n\n${body}`, category: 'employee_review' }`. Success **Feedback Received
Successfully!** + **Go back** → `/dashboard/employees`. Invalidate `['companyEmployees']`,
`['userReviews']`, `['participationStatus']`, `['monthlyPrompt']`.

## C. Profile `/dashboard/profile` (company)

Logo, companyName, **Verified** / **Unverified** (→ `/dashboard/kyc`), `BID-{publicId}`,
industry, rating, companySize; ParticipationStatCard; KYC banner; About card (description or
**No description added yet.**) with edit → `/dashboard/profile/bio` (company writes
`description`); menu **Edit profile information** (`/dashboard/profile/edit`), **Employees**
(`/dashboard/employees`), **Candidate preferences** (`/dashboard/candidate-preferences`),
**My jobs** (`/dashboard/jobs`).

### Edit `/dashboard/profile/edit` (company branch)
Logo upload (`POST /users/avatar` field `image`), company name, industry combobox (31; invalid
→ **Please pick your industry from the list.**), company size select [Small (1 - 10
employees), Medium (20 - 50 employees), Large (50 - 200 employees), Enterprise (200+
employees)], address, phone and email with the same gated flows as individuals (reuse
`EmailChangeDialog` / `IdRequestDialog`). Save `PUT /users/profile { companyName, industry,
companySize, address, avatar }` → **Profile updated successfully**.

## C. Company KYC `/dashboard/kyc` (company branch)

Verified → **You are verified ✓** / **Your company has already been verified — no need to
submit KYC again.** Pending → status card. Order: Authorization → Intro → Address → Method.
- Authorization: **Business verification authorization** / **Before you verify this business,
  Rateo needs to know who you are and that you're allowed to do it on the company's behalf.**
  Radios: owner **I am the business owner**, hr **I am HR at this company**, representative
  **I am an authorized representative of the owner**, other **Other** (+ **Describe your
  relationship to the business**). **Your role / position** (**e.g. Owner, HR Manager,
  Director**; prefill Owner/HR). Legal text verbatim: **I confirm that I am the owner of this
  business, or that I am duly authorized by the owner or management to verify this business on
  Rateo. I confirm that the information I provide is true and accurate, and I understand that
  Rateo relies on this declaration in verifying the business. I accept responsibility for this
  verification and understand that false declarations may result in removal of the business
  profile and suspension of my account.** Checkbox **I have read and agree to the above**.
  `POST /users/kyc/attestation { verifierType, verifierTypeOther?, role, accepted: true }`.
  Skip this step when the user already has an accepted attestation (server 400
  `ATTESTATION_REQUIRED` tells you it is missing; otherwise proceed).
- Intro: **Complete your KYC** / **Verify your company's identity to keep Rateo safe and
  trusted. Once approved, you'll unlock full access to candidate profiles.** Card **Get the
  verified badge** (**Undone**): **• Company Address**, **• Proof of Address**, **• CAC
  documents**; **Let's go**.
- Address step: **Get verified badge** / **Please provide the following to get verified.**
  Company Address; State select (37 states + **Other (type it myself)** + **Abroad**); LGA
  select from `src/lib/constants/nigeria-lgas.ts` (port from
  `app-rateo/src/constants/nigeriaStatesLGA.js`; include **Other (type your LGA)**); **Upload
  proof of address (png, pdf, Jpg. Max 5Mb)** → `POST /upload`. Validation **Please provide
  all address details**.
- Method step: **Verify instantly** → `/dashboard/kyc/dojah?flow=business` (`POST
  /users/kyc/dojah/init { flow: 'business' }`); link **Verify with team review instead** →
  **Verify with team review**: **CAC registration number** (≤9 digits), **CAC certificate
  (png, pdf, Jpg. Max 5Mb)**, **Live selfie of you (the person verifying)** (**Front camera
  only — this confirms who submitted this verification.**, reuse `SelfieCapture` → `POST
  /upload`), **Complete Verification**. Validation **Please provide your CAC details and take
  a live selfie**. `POST /users/kyc { address, state, city, proofOfAddress, cacNumber,
  cacCertificate, attesterSelfieUrl }`. Success **Thank you! We will verify and get back to
  you.** / **Our team will go through the details you've provided. This usually takes
  24hours.** Errors: `ATTESTATION_REQUIRED` → return to the authorization step;
  `ATTESTER_SELFIE_REQUIRED` → highlight the selfie.
