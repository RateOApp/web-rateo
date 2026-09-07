# Individual dashboard (Phase 4) — spec ported from app-rateo

Facts come from the mobile screens and server-rateo controllers. Payloads, gates and copy must
match; layout adapts to the browser. All calls go through the `/api` proxy (axios `api`).

## Shared rules

- Current user: `useMe()` (client, seeded from the server `UserProvider`). After any mutation
  that changes the profile, `queryClient.invalidateQueries({ queryKey: ['me'] })` and
  `router.refresh()`. **Never** replace local user state with a `PUT /users/profile` response:
  it returns only a subset of fields. Always refetch.
- `PUT /users/profile` accepts (individual): `firstName, lastName, gender, dob, bio, location,
  avatar, skills, experience (full array), education, jobPreferences, resume, phone`.
  `setupCompleted` flips only when `=== true`. Response includes a fresh `token` (the proxy
  captures tokens only on auth paths, so this one is simply ignored — do not store it).
- KYC gate: `user.kycStatus === 'verified'` unlocks apply, save job, messages, ratings, explore
  companies. Unverified → open **KycRequiredDialog** (copy below) instead of calling the API.
  Also treat a 403 whose message matches `/kyc|verif/i` the same way.
- Participation lock: some endpoints answer `403 { code: 'PARTICIPATION_OVERDUE' }`. Show the
  **ParticipationLockDialog** (copy below). Pre-empt when `participationStatus === 'overdue'`
  for apply, express interest, request-company.
- Rating window: days 1–10 of the month (`src/lib/rating-window.ts`).
- Money: `formatNaira`. Dates: `formatDate`, `timeAgo` from `src/lib/format.ts`.
- Copy in **bold** below is verbatim from mobile; keep it.

### KycRequiredDialog
Title **Verification Required**. Body **You cannot access this service until you complete your
KYC verification process.** Info box **KYC (Know Your Customer) verification helps us maintain
security and comply with regulations. The process typically takes 1-2 business days once
submitted.** Buttons **Start Verification** (→ `/dashboard/kyc`) and **Go back**.

### ParticipationLockDialog
Title **Feature locked**. Body **This feature is locked until you complete your monthly
rating. Submit your rating for this month (1st–10th) to unlock it instantly.** Buttons
**Complete my rating** (→ `/dashboard/ratings`) and **Not now**.

### Participation (`GET /participation/status`, own; `GET /participation/:userId`, others)
```
{ participationScore: number|null, participationStatus: 'not_established'|'current'|'grace'|'overdue',
  role, period, owed, rated, outstanding, complete, counterparties: [{ companyId, companyName, avatar, rated }],
  employers: [...same] }
```
Tiers in `src/lib/participation.ts`. Home subtitle copy by status:
not_established **Not yet established — starts counting when you rate your company.**;
grace **You missed last month — rate this month to stay on track.**; overdue **Features locked —
rate now to unlock.**; current: ≥90 **Excellent! Keep up your consistency.**, ≥70 **Good — don't
miss a rating window.**, else **Falling behind — rate this month to recover.**
Info tooltip: **Your participation score reflects how consistently you complete your monthly
ratings (1st–10th of each month). Completing every rating keeps it high; missed months reduce
it. It is separate from your star rating.**
Banner (only inside the window and `outstanding > 0`): current **Rate your employer — window
closes on the 10th.**; grace **You missed last month — rate your employer to stay on track.**;
overdue **Your features are locked — rate now to unlock.** Links to `/dashboard/ratings`.

## A. Home `/dashboard` (individual)

- Header card: avatar, **Hello {firstName}**, OG badge if `isOg`. KYC banner when not verified:
  pending → **Verification pending** / **This usually takes 24 hours**; none/rejected →
  **Complete KYC to get verified** / **Boost your credibility with a verified badge. Tap to
  start.** (→ `/dashboard/kyc`).
- Overall rating card: `GET /reviews/:myId` → `averageRating`, `totalReviews`. Title by average:
  0 reviews **No ratings yet**; ≥4.5 **Your feedback is great!**; ≥3.5 **Your feedback is
  positive**; ≥2.5 **Mixed feedback**; ≥1.5 **Needs improvement**; else **Significant concerns
  noted**. Subtitle **Build your profile by getting reviews.** / **Click to see a breakdown of
  your reviews.** Links to `/dashboard/ratings`. Participation ring + subtitle + tooltip inside.
- Participation banner (above).
- Monthly prompt: `GET /reviews/status/monthly` → `{ shouldPrompt, reason?, outstandingCount? }`.
  If `shouldPrompt` and in window and user has a current employer, show a dismissible card
  (once per day, `localStorage` key `ratingPromptSeen-{userId}-{YYYY-MM-DD}`): **Time to rate
  your employer** / **You can submit your monthly rating between the 1st and 10th of each
  month.** Buttons **Rate now** (→ `/dashboard/ratings/rate`) / **Maybe later**.
- Two action tiles: **Explore Reviews** / **See top-rated companies!** (→ `/dashboard/explore`)
  and **Write a Review** / **Let your voice be heard!** (KYC gate, then window check with
  toast **Rating unavailable** / **You can only submit ratings between the 1st and 10th of each
  month.**, then → `/dashboard/ratings/rate`).
- **Job opportunities for you** + **See all jobs** (→ `/dashboard/explore/jobs`). Feed:
  `GET /jobs` with NO `categories` param (server personalises). Client match score
  (`src/lib/job-match.ts`): skills overlap 40 %, title 30 % (exact 30, substring 22, else token
  overlap ratio × 30), location 15 % (exact 15, substring 10), salary 15 % (minSalary inside
  `[pref.minSalary, pref.maxSalary]` 15, within ±20 % 10). Imported jobs = 0. Sort desc.
  Render a card stack/list with **Pass** and **Like** buttons: Like on native job → check
  `['savedJobs']` cache, else `POST /jobs/:id/save` (toast **Job saved**; `/already/i` → **Job
  already saved**; KYC error → dialog); Like on imported → `POST /imported-jobs/:id/interest`
  (toast **Interest registered — we'll notify you if the employer joins**). Pass = local
  dismiss only. Card: logo, title (link `/jobs/[id]`), company (+OG), Imported badge with
  **Employer not yet on Rate'O**, salary (+ `/month` unless imported), chips `[type,
  workArrangement, category]`, match badge **{n}% Match** or **{interestCount} interested** /
  **Be the first to show interest**.
  Empty states: preferences applied (`categories` non-empty in response) → **No jobs in your
  industries right now** / **Check back soon, or browse everything that's open right now.** +
  **Browse all jobs**; else **You're all caught up** / **There are no more job opportunities to
  swipe on right now. Check back soon or explore top-rated companies.** Error → **Something
  went wrong** / **We couldn't load jobs. Check your connection and try again.** + **Retry**.

## A. Explore `/dashboard/explore` (individual view)

- KYC gate: content dimmed (`opacity-40 pointer-events-none`) behind a VerificationCard:
  unverified **Verification Required** / **Verify your identity to explore and view
  companies.** / **Start Verification**; pending **Verification in Progress** / **Your documents
  are under review. Please check back later.** / **Check Status**; rejected **Verification
  Rejected** / **Your documents were not approved. Please upload them again.** / **Try Again**.
- Search **Search for companies & people** (debounced suggestions from `GET
  /users?role=company&keyword=`, top 5: avatar, companyName, industry || Company, public id
  `ID-xxxxxx`). Submit → results list on the same page (`?q=`).
- Banner **Looking for a job? Browse all jobs** → `/dashboard/explore/jobs`.
- **Top rated companies**: first page sorted by `topRatedScore` (in `src/lib/rating.ts`), top 5,
  cards with ring/chip or **Not yet established**. Then the full paginated directory (reuse
  `CompanyCard`, links to `/companies/[id]`).
- `/dashboard/explore/jobs`: same as public `/jobs` (search by title, category chips with the
  user's `jobPreferences.categories` hoisted first, infinite/paged list, links `/jobs/[id]`).
  Empty: **No jobs found** / **Nothing matches "{q}" right now. Try a different title.** or
  **There are no open roles here yet.** + **Show all industries** when filtered.

## A. Saved `/dashboard/saved`

Tabs **Applications** and **Saved Jobs** with count badges.
- Applications: `GET /jobs/user/applied` → `{ applications: [{ _id, status, appliedAt, job }] }`.
  Status pill (case-insensitive): accepted|approved|hired|received → success; rejected → muted;
  else (pending, reviewed, interested) → warning. Label = capitalised status, default
  **Received**. Row: logo, title, company, salary, type chip. Link `/jobs/[id]`. Remove (only
  when status is accepted|approved|hired|rejected): dialog **Are you sure you want to delete?**
  / **This action cannot be undone.** / **Cancel** / **Yes, delete** → `DELETE /jobs/:jobId/apply`
  → toast **Application removed**. Empty **You don't have any applications yet.** / **Start
  applying to jobs to see them here.** + **Find jobs to apply** (→ `/dashboard/explore/jobs`).
- Saved Jobs: `GET /jobs/user/saved` → `{ savedJobs: Job[] }`. Row: logo, title, company +
  `overallRating` star if > 0, salary. Remove on every row → `DELETE /jobs/:id/save` → toast
  **Removed successfully**. Empty **You don't have any saved jobs yet.** / **Start saving jobs
  to see them here.** + **Find great jobs**.
- Query keys `['appliedJobs']`, `['savedJobs']`; invalidate on apply/save from anywhere.

## A. Job detail additions (public `/jobs/[id]`, logged-in individual)

Existing `JobActions` gains: initial applied/saved state from `['appliedJobs']` / `['savedJobs']`
queries; labels **Apply now** / **Applied** / **Application Closed**; **Save for later** hides
once saved; imported → **Show interest** then **Interest registered ✓**; participation pre-empt;
KYC dialog. Overflow menu (native jobs only): **Report Job** (dialog: **Please provide a reason
for reporting this job.**, inputs reason placeholder **Reason (e.g. Scam, Offensive)** and
optional **Additional details (optional)**; `POST /jobs/:id/report { reason, details }`; empty
reason → **Please provide a reason**; success **Job reported successfully**) and **Not
Interested** (confirm **Are you sure you want to hide this job? You won't see it in search
results anymore.** / **Hide** → `POST /users/jobs/:id/block` → **Job hidden successfully** →
back to `/dashboard`).

## A. Notifications `/dashboard/notifications`

`GET /notifications` → array or `{ notifications }`. Fields `_id, type, content, read,
createdAt`. Unread rows tinted with a dot. Tap → `PUT /notifications/:id/read` then route by
type: kyc → `/dashboard/profile`, message → `/dashboard/messages` (KYC gate), rating →
`/dashboard/ratings`, account → `/dashboard/profile`, application → `/dashboard/saved`,
job_match → `/dashboard`, employment → `/dashboard/work-history`, default profile. Row menu
**Delete notification** / **This notification will be removed.** → `DELETE /notifications/:id`
→ toast **Notification deleted**. Header action **Mark all as read** → `PUT
/notifications/read/all`. Time: <60 s **Just now**, <1 h `{m}m`, <24 h `{h}h`, else date.
Empty **No notifications yet**. Bell badge in the app header = unread count (99+ cap), query
key `['notifications']`, refetch every 60 s.

## B. Profile `/dashboard/profile` (individual)

Header: avatar, **{firstName} {lastName}**, OG badge, KYC pill **Verified** (blue) or
**Unverified** (grey, link `/dashboard/kyc`), `ID-{publicId}`, job title (`experience` current
→ first → **Job Seeker**), rating `formatRating(averageRating)` from `GET /reviews/:id`,
participation stat card (**Overall rating** | **Participation score**, captions **No ratings
yet** / **Not yet established**). Bio card (**No bio added yet.**) with edit → `/dashboard/
profile/bio`. Skills chips (**No skills added**). Menu rows: **Edit profile information**
(`/dashboard/profile/edit`), **Update skills** (`/dashboard/profile/skills`), **Work history**
(`/dashboard/work-history`), **Request to join a company** (`/dashboard/request-company`),
**Job preferences** (`/dashboard/preferences`), **My Resume** (`/dashboard/resume`).

### Edit profile `/dashboard/profile/edit`
Avatar (file input → `POST /users/avatar` field `image` → `{ avatar }`, then included in the
save payload), first name, last name, gender select (Male, Female, Other, Prefer not to say),
date of birth (`<input type=date>`, send ISO only if set/changed), contact email (read-only;
link **Edit your email**), phone (read-only, `+234` prefix display; link **Request to edit**).
Save → `PUT /users/profile { firstName, lastName, gender, dob?, avatar }` (never phone/email).
Status pills when requests exist: **Request pending** (`emailEditRequest`/`phoneEditRequest`)
and **Approved — you can edit** (`isEmailEditable`/`isPhoneEditable` → inline input + **Save new
email** `PATCH /users/email { email }` / **Save new phone** `PATCH /users/phone { phone }`).
Email change dialog (`EmailChangeDialog`): step choose **Edit your email** / **How would you like
to update your email address?** options **Send OTP and edit** (We'll verify your current email,
then your new one) and **Contact admin to request to edit** (Use this if you no longer have
access to your current email). OTP path: `POST /users/email/change/start` → **Verify current
email** / **Enter the 6-digit code we sent to {email}** (6-digit OTP, 60 s resend) → `POST
/users/email/change/verify-old { code }` → **Your new email** / **Enter the email address you'd
like to use. We'll send a code to confirm it.** → `POST /users/email/change/send-new { newEmail }`
→ **Confirm new email** → `POST /users/email/change/verify-new { code }` → `{ email }` →
**Email updated** / **Your email is now {email}**. Admin path (`IdRequestDialog`, used for email
and phone): **Request Edit Access** / **To update your {label} ({value}), you must first request
access. An administrator will review your request and you'll be notified once it's approved.**
Fields: NIN (11 digits) and a live selfie captured with `getUserMedia` (front camera, no
file upload) → uploaded via `POST /upload` field `file` → `PATCH /users/email/request` or
`/users/phone/request` `{ nin, selfieUrl }` → **Request sent** / **An admin will review your
request. You'll be able to edit your {label} once it's approved.**

### Bio `/dashboard/profile/bio`: textarea placeholder **Write something about yourself...**,
100-word limit, **{n} words left**, save `PUT /users/profile { bio }` → **Bio updated successfully**.
### Skills `/dashboard/profile/skills`: input **e.g. React Native** + **Add**, list with remove
and up/down reorder, save `PUT /users/profile { skills }` → **Skills updated successfully**.

### Work history `/dashboard/work-history`
Data: `GET /users/:id/work-history` → `[{ id, title, company, companyId, companyLogo, startDate,
endDate, current, description, isVerified, endedBy, endMethod, noticeDays, noticeEffectiveDate,
noticeGivenAt }]`. Card: company (+Verified check when `isVerified`), title, `M/YYYY – Present |
M/YYYY`, method chip only when `!current && endedBy === 'employee'`: **Resigned — gave {n}
days' notice** / **Resigned — immediate**. Description or **Add a description of your role**.
Edit (dialog `UpdateJobDialog`): company (read-only when editing; note **Company name can't be
changed.**), role, start date, end date (hidden when current), description, checkbox **I
currently work here**. Save rebuilds the full `experience` array (keep `_id` of untouched
entries so `isVerified` survives) → `PUT /users/profile { experience }`. **Remove Experience?**
/ **Are you sure you want to remove this experience from your profile?**
Notice banner when a current job has `noticeEffectiveDate`: **Notice period active** — **You
gave {n} days' notice — last working day {date}.** or **Your employer has given you notice —
last working day {date}.** + **Withdraw notice** (employee-given only) → `POST
/users/employment/notice/withdraw` → **Notice withdrawn** / **Your employment continues as
before.**
**End contract** (only `current && companyId && !noticeEffectiveDate`) dialog: **End contract**
/ **How do you want to end your employment with {company}?** Options **Give notice** (Pick a
last working day at least 7 days ahead — employment continues until then; info: **The
professional way to end a contract. Employment continues until the last working day, and the
other party is notified today. This is recorded on your profile as 'Gave notice'.**) and **End
immediately** (Ends today. This cannot be undone; info: **Ends the contract today and cannot be
undone. This is permanently recorded on your profile as an immediate ending and affects how
others see the way you end contracts.**). Notice form: date (min today+7, max today+90),
summary **Last working day: {date} · {n} days' notice**, reason select [Relocation, Got another
offer, Scholarship/further studies, Personal/family reasons, Health reasons, Career change,
Others], note (required 3–500 when Others, else optional ≤500, counter), **Confirm notice**.
Immediate form: warning **This ends your employment today and cannot be undone**, reason, note,
box **This ends the contract today, cannot be undone, and is permanently recorded on your
profile.**, **Confirm — end today**. Submit `POST /users/employment/end { mode:
'notice'|'immediate', reason, note?, effectiveDate? }`. Toasts **Notice given** / **Your last
working day is {date}.** or **Contract ended** / **Your employment has ended today.**

### Resume `/dashboard/resume`
`GET /users/:id/resume` → `{ resume }` (404 → none). Upload PDF ≤5 MB → `POST /users/:id/resume`
field `resume` → `{ resume }`. Actions: view (open in new tab / embed in `<iframe>`), replace,
delete (**Delete resume** / **Are you sure you want to remove your resume?** → `DELETE`).
Empty **No resume uploaded.** Also show a read-only summary: name, ID, title, location, bio,
skills, work experience list.

### Job preferences `/dashboard/preferences`
Step 1: **What field would you like to see jobs in?**, **Selected {n} of 3**, grid of the 31
industries with counts from `GET /jobs/categories` (**No open jobs** / **{n} jobs**), search
filter, max 3 (**Limit reached** / **You can choose up to 3 industries.**). **Next**.
Step 2: chips of chosen categories; **Job description** (→ `jobTitle`, e.g. Software Engineer);
**Location** free text (e.g. Lagos, Nigeria); **Min. salary** / **Max. salary** numeric (₦);
**Minimum company rating** 1–5 stars (default 3). Save `PUT /users/profile { jobPreferences: {
categories, category: categories[0], jobTitle, location, minSalary, maxSalary, minRating } }`
→ **Preferences updated successfully** → `/dashboard/profile`. Seed from
`user.jobPreferences` (fold legacy `category`).

### KYC `/dashboard/kyc`
Verified → **You are verified ✓** / **Your account has already been verified — no need to
submit KYC again.** Pending → status card **Verification pending** / **This usually takes 24
hours**. Rejected → **Verification Rejected** with `kyc.adminComment` if any + retry.
Intro: **Complete your KYC** — **Verify your identity to keep Rateo safe and trusted. Once
approved, you'll get the verified badge and can apply for jobs, message employers, and rate
your workplace.** Card **Get the verified badge** (**Undone**): **• National Identity Number
(NIN)**, **• A live selfie (front camera)**, button **Let's go**. Card **Become a Rateo OG**:
**• Get verified badge**, **• Use the app Actively for six (6) months**.
Step: **Get verified badge** / **Verify your identity with NIN + a live selfie in seconds.**
Primary **Verify instantly** → `/dashboard/kyc/dojah`. Link **Verify with team review instead**
reveals **Manual verification** / **Please provide the following to get verified.**: NIN (11
digits, placeholder 3462789465) + live selfie (`getUserMedia` capture → `POST /upload` field
`file` → url). Validate `/^\d{11}$/` and selfie else **Please enter a valid 11-digit NIN and
take a live selfie**. Submit `POST /users/kyc { nin, selfieUrl }` → success **Thank you! We
will verify and get back to you.** / **Our team will go through the details you've provided.
This usually takes 24hours.** → **Done**.
Dojah `/dashboard/kyc/dojah`: `POST /users/kyc/dojah/init { flow: 'individual' }` → `{ appId,
publicKey, widgetId, referenceId, userData: { first_name, last_name, email }, metadata: {
user_id } }`. Embed `https://identity.dojah.io?widget_id={widgetId}&metadata[user_id]={referenceId}
&user_data[first_name]=…&user_data[last_name]=…&user_data[email]=…` in an `<iframe
allow="camera; microphone">` (full height). Listen to `window` `message` events; if the payload
matches `/success|complete|approved|verified|finish/i` → `POST /users/kyc/dojah/confirm`, toast
**We're verifying your identity — your badge updates shortly.**, go to `/dashboard/profile`;
`/close|cancel|exit|error/i` → `POST /users/kyc/dojah/cancel`, back to `/dashboard/kyc`. Also
provide explicit buttons **I've finished** (confirm) and **Cancel** (cancel) because the
hosted widget's postMessage contract is unconfirmed. Error → **Something went wrong** + message
+ **Verify manually instead**.

### Request company `/dashboard/request-company`
Title **Join a company**. Status card if a current linked job: verified → **You're confirmed at
{company}.**; pending → **Request pending with {company} — they'll confirm you soon.** Intro
**Search for your company and send a request to join. The company will confirm you as an
employee.** Search (`GET /users?role=company&keyword=`), pick → confirm **Request to join** /
**Send a request to join "{name}"? They'll confirm you as an employee.** → `POST
/users/request-company { companyId }` (participation pre-empt) → **Request sent** / **{name}
will confirm you as an employee. You'll see it once they accept.** No results → **"{q}" isn't
on Rateo yet. Invite them so they can confirm you as an employee.** + **Invite {q}** dialog
(**Enter the company's email. They'll get an invite to join Rateo, and signing up with this
email automatically connects you.** → `POST /invitations/company { email, companyName }` →
**Invite sent** / **We've invited {name} to join Rateo. When they sign up with {email}, you'll
be connected automatically.**).

## C. Ratings `/dashboard/ratings` (individual)

Tabs **My Rating** and **Company's Rating**. Data: `GET /reviews/:myId` → `{ reviews,
averageRating, totalReviews, detailsBreakdown }`; current employer = `experience` entry with
`current && companyId` → `GET /users/:companyId`, `GET /reviews/:companyId`, `GET
/participation/:companyId`.
- My Rating: feedback card by average (same tiers as home), avatar/name/title, rating +
  star, metrics bars for Attendance, Behaviour, Responsibility, Skills, Performance (from
  `detailsBreakdown` through `canonicalCriterion`; default 0), reviews list: reviewer
  `companyName || first last || Company`, date, stars, body: `commentHidden` → lock **Feedback
  hidden — this user hasn't completed their monthly rating.**; `isCurrentEmployee` → lock
  **Review hidden — revealed when the contract ends.**; else first 150 chars + **Read more...**
  (opens a dialog with the full review: title/body split on the first blank line). Empty **No
  reviews yet.**
- Company's Rating: no employer → **You do not work for any company yet** / **When you join a
  company on Rateo, their ratings will appear here.** Else privacy card **Relax 🙃** / **Your
  employers can't see the ratings & comments you give till you leave the company.**, company
  header, participation stat card, metrics bars for Salary, Career Growth, Management, Work
  Environment, Fairness (or **No metrics available yet.**), reviews (hidden when
  `isCurrentEmployee`: **Still an employee — rating cannot be seen until after termination of
  contract.**). Sticky CTA: **Rated this month ✓** (a review by me on this company this month
  exists) else **Update company rating**. Gates in order: KYC dialog; window (**Rating
  unavailable** / **You can only submit ratings between the 1st and 10th of each month.**);
  already rated (toast **Already rated** / **You have already rated your company this month.**);
  then → `/dashboard/ratings/rate`.

### Rating flow `/dashboard/ratings/rate` (individual rates employer)
On load: window check (else toast + back), `GET /reviews/status/monthly` (if `shouldPrompt ===
false` and reason not `no_current_employer`/`outside_rating_window` → **Already rated** and
back; if `no_current_employer` → explain and link to request-company). Target = current
employer (fetch `GET /users/:companyId` for name/logo).
6 steps: Salary, Career Growth, Management, Work Environment, Fairness, Comment. Criterion
step: **What would you rate your company in terms of {criterion}?**, 5 buttons 1–5 with
**Poor** under 1 and **Excellent** under 5, ⓘ opens an info dialog from `RATING_CRITERIA_INFO`
(**This rating may include:** + bullets + **Got it**). Continue requires a value (**Pick a
rating** / **Please select a rating for {criterion} to continue.**). Comment step: **Leave a
comment.**, **Title**, **Comment** (both required: **Title and comment required** / **Your
written review is the core of Rateo — please add a title and a comment before submitting.**).
Submit `POST /reviews { targetId, rating: avg of 5, details: { Salary, 'Career Growth',
Management, 'Work Environment', Fairness }, comment: `${title}\n\n${body}`, category:
'company_review' }`. Success screen **Feedback Received Successfully!** + **Go back** (→
`/dashboard`). Invalidate `['userReviews']`, `['companyRatings']`, `['participationStatus']`,
`['monthlyPrompt']`. Server errors (400/403 messages) shown in a toast.

RATING_CRITERIA_INFO (summary + points):
- Salary — How fairly and reliably the company pays you. Salary paid on time; Fair pay for the
  role; Bonuses or incentives (if applicable); Employee benefits (if applicable); Overtime pay
  (if applicable)
- Career Growth — How much the company helps you grow professionally. Promotion opportunities;
  Training; Learning new skills; Career progression; Recognition for good work
- Management — How well leaders and supervisors treat and guide their team. Leadership;
  Communication; Respect from managers; Fair decision-making; Support from supervisors
- Work Environment — What it feels like day to day inside the workplace. Workplace safety;
  Respect in the workplace; Freedom from bullying or harassment; Working conditions; Workplace
  culture
- Fairness — Whether the company treats people equally and keeps its word. Equal treatment;
  Honesty; Keeping promises; Fair company policies; Respecting employee rights
- Attendance — How consistently they show up and manage their time. Attendance; Punctuality;
  Reliability; Time management; Meeting work schedules
- Behaviour — How they conduct themselves with colleagues and at work. Professionalism;
  Respect; Teamwork; Communication; Attitude; Following workplace rules
- Responsibility — How dependably they own their duties and see them through. Accountability;
  Taking responsibility; Dependability; Commitment; Completing assigned tasks; Initiative
- Skills — Their knowledge, ability and capacity to learn. Job knowledge; Technical ability;
  Learning ability; Problem-solving; Competence
- Performance — The quality and output of the work they deliver. Quality of work;
  Productivity; Meeting targets; Efficiency; Accuracy
Legacy aliases: Punctuality→Behaviour, Professionalism→Management, Safety→Work Environment,
Duty of care→Fairness.

## C. Settings `/dashboard/settings`

Sections. Account: **Edit profile** (`/dashboard/profile/edit`), **Change password**
(`/dashboard/settings/password`), **Notification** (`/dashboard/settings/notifications`), **KYC**
(verified → toast **You are verified ✓** / **Your account has already been verified — no need
to submit KYC again.**; else `/dashboard/kyc`). Support: **Help & Support** (`/dashboard/help`),
**Terms and Policies** (`https://rateo.ng/terms`, new tab). Actions: **Report a problem**
(`/dashboard/report`), **Share App** (`navigator.share` / copy: **Check out Rateo — rate and
discover workplaces. Download the app: https://rateo.ng**), **Log out** (confirm **Are you
sure you want to log out?**). Delete account (destructive): dialog 1 **Delete your account?** /
**Your account will be deactivated immediately and permanently deleted after 14 days. Logging
in again within 14 days cancels the deletion.** → **Continue**; dialog 2 **Are you absolutely
sure?** / **Your account disappears from Rateo now and is permanently deleted on day 14 unless
you log back in.** → **Delete my account** → `DELETE /users/:id` → toast **Account deactivated**
/ **It will be permanently deleted in 14 days — log in again to cancel.** → logout.

### Change password `/dashboard/settings/password`
Old, new (+ checklist), confirm. Rules in order: all required (**Please fill in all fields**);
policy (**Weak password** message); new === old → **Choose a different password** / **You have
used this password before. Please choose a new password.**; mismatch → **New passwords do not
match**. `POST /auth/change-password { currentPassword, newPassword }` → **Your password has
been changed.** Server `errors[]` joined with newlines.

### Notification settings `/dashboard/settings/notifications`
Local only (`localStorage` `notificationSettings` `{ notification: true, push: false, email:
true }`): toggles **Notification**, **Push notification**, **Email notification**.

### Help `/dashboard/help`
`GET /faqs` → `[{ _id|id, question, answer, category }]`. Search filter, accordion, category
chip. Empty **No FAQs Available** / **There are currently no FAQs in our database. Please check
back later.** + **Refresh**. No results **No results found** / **Try using different keywords**.

### Report a problem `/dashboard/report`
On load `GET /support/tickets`; if one has `status === 'open'` redirect to
`/dashboard/support/[id]` (unless `?new=1`). Form: subtitle **If a feature or product isn't
working correctly, you can give feedback to help us make Rateo better.** Problem type select
[Feature Not Working, Bug Report, Performance Issue, UI/UX Problem, Account Issue, Other];
**Describe problem** textarea with **{n} words left** (100); **Evidence (png, jpg. Max 5Mb)**
single image → upload via `POST /upload` field `file` first, send the URL. Validate type +
description (**Please select a problem type and describe the problem.**). `POST /support/tickets
{ type, description, attachments: [url] }` → redirect to `/dashboard/support/[ticket._id]`.
Error **Failed to submit report. Please try again.**

### Support ticket `/dashboard/support/[id]`
`GET /support/tickets/:id` → ticket `{ _id, type, description, status, attachments, messages:
[{ _id, sender/from, text, attachments, createdAt }], createdAt }` (inspect the controller for
exact names). Show the thread, status badge, composer `POST /support/tickets/:id/messages {
text, attachments }`, poll every 15 s (sockets arrive in Phase 6). Link **New report** →
`/dashboard/report?new=1`.
