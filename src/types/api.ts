/**
 * Hand-written mirrors of the server-rateo REST contract.
 * Source of truth: `docs/API_CONTRACT.md` (which mirrors
 * `server-rateo/src/routes/*` and `src/controllers/*`).
 *
 * The backend envelope is FLAT - there is no `{ success, data }` wrapper.
 * Mongo documents are loosely populated, so almost every field is optional and
 * must be narrowed at the render site.
 */

export type Role = 'individual' | 'company';

/** `user.kycStatus` on the raw document. */
export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

/** Normalised `user.kyc.status` returned by `GET /users/:id`. */
export type PublicKycStatus = 'approved' | 'pending' | 'rejected' | 'unverified';

export type ParticipationStatus = 'good' | 'warning' | 'overdue' | 'locked' | (string & {});

export type ApiMessage = { message: string };

export type Paginated = { page: number; pages: number };

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export type Experience = {
  _id?: string;
  title?: string;
  company?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  description?: string;
};

export type Education = {
  _id?: string;
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  description?: string;
};

export type JobPreferences = {
  categories?: string[];
  jobTitle?: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  minRating?: number;
};

export type Kyc = {
  status?: PublicKycStatus;
  method?: string;
  verifiedAt?: string;
  rejectedReason?: string;
};

export type ContractEndSummary = {
  noticeCount?: number;
  immediateCount?: number;
};

/**
 * One shape for both roles. Only `_id`, `role` and `email` are guaranteed;
 * every other field depends on the endpoint and the account type.
 */
export type User = {
  _id: string;
  role: Role;
  email: string;

  publicId?: string;
  avatar?: string;
  location?: string;
  phone?: string;
  phone_number?: string;
  website?: string;
  bio?: string;
  isOg?: boolean;
  isVerified?: boolean;
  setupCompleted?: boolean;
  kycStatus?: KycStatus;
  kyc?: Kyc;
  overallRating?: number;
  participationScore?: number;
  participationStatus?: ParticipationStatus;
  createdAt?: string;
  updatedAt?: string;
  deletionCancelled?: boolean;

  emailEditRequest?: string | null;
  isEmailEditable?: boolean;
  phoneEditRequest?: string | null;
  isPhoneEditable?: boolean;

  /* individual */
  firstName?: string;
  lastName?: string;
  gender?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  jobPreferences?: JobPreferences;
  jobTitle?: string;
  resume?: string;
  savedJobs?: string[];

  /* company */
  companyName?: string;
  industry?: string;
  companySize?: string;
  description?: string;
  candidatePreferences?: Record<string, unknown>;
  isClaimed?: boolean;
  claimStatus?: string;
  contractEndSummary?: ContractEndSummary;
};

/** A `User` known to be a company account. */
export type Company = User & { role: 'company' };

export type UsersResponse = Paginated & { users: User[] };

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

/** The trimmed company projection populated onto native jobs. */
export type JobCompany = {
  _id: string;
  companyName?: string;
  avatar?: string;
  location?: string;
  isClaimed?: boolean;
  claimStatus?: string;
  description?: string;
  website?: string;
  isOg?: boolean;
  overallRating?: number;
};

export type JobApplicantStatus =
  | 'pending'
  | 'reviewed'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | (string & {});

export type JobApplicant = {
  _id?: string;
  applicant: string | User;
  status?: JobApplicantStatus;
  appliedAt?: string;
};

export type JobStatus = 'open' | 'closed' | (string & {});
export type WorkArrangement = 'Remote' | 'Hybrid' | 'On-site' | (string & {});
export type GenderPreference = 'any' | 'male' | 'female' | (string & {});

/** Native job posted by a Rate O company account. */
export type Job = {
  _id: string;
  isImported?: false;
  title?: string;
  type?: string;
  workArrangement?: WorkArrangement;
  location?: string;
  category?: string;
  genderPreference?: GenderPreference;
  skills?: string[];
  minSalary?: number;
  maxSalary?: number;
  description?: string;
  tasks?: string[];
  perks?: string[];
  deadline?: string;
  minRating?: number;
  status?: JobStatus;
  company?: JobCompany;
  applicants?: JobApplicant[];
  createdAt?: string;
  updatedAt?: string;
};

/** Job scraped from an external board. Carries no company account and no PII. */
export type ImportedJob = {
  _id: string;
  isImported: true;
  title?: string;
  companyName?: string;
  salary?: string;
  employmentType?: string;
  workArrangement?: WorkArrangement;
  location?: string;
  category?: string;
  description?: string;
  deadline?: string;
  interestCount?: number;
  expectationCopy?: string;
  sourceUrl?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AnyJob = Job | ImportedJob;

export function isImportedJob(job: AnyJob): job is ImportedJob {
  return job.isImported === true;
}

export type JobsResponse = Paginated & {
  jobs: AnyJob[];
  totalCount?: number;
  categories?: string[];
};

export type JobCategory = { industry: string; count: number };

export type JobCategoriesResponse = { categories: JobCategory[] };

/** `GET /jobs/user/applied` - one entry per application, job embedded. */
export type JobApplication = {
  _id: string;
  status?: JobApplicantStatus;
  appliedAt?: string;
  job: Job;
};

/* -------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* -------------------------------------------------------------------------- */

export type Review = {
  _id: string;
  rating?: number;
  comment?: string;
  /** Per-criterion scores; keys double as the display labels. */
  details?: Record<string, number>;
  createdAt?: string;
  isCurrentEmployee?: boolean;
  reviewer?: Pick<User, '_id' | 'firstName' | 'lastName' | 'avatar' | 'companyName' | 'role'>;
};

/** `GET /reviews/:userId` - an array on some deployments, an object on others. */
export type ReviewsResponse =
  | Review[]
  | {
      reviews: Review[];
      averageRating?: number;
      totalReviews?: number;
      detailsBreakdown?: Record<string, number>;
    };

/** Flattens either `GET /reviews/:userId` shape into a plain array. */
export function normaliseReviews(data: ReviewsResponse | null | undefined): Review[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.reviews)) return data.reviews;
  return [];
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * What the backend returns from a token-issuing auth path.
 * NOTE: the `/api` proxy strips `token` before the body reaches the browser -
 * it is moved into the httpOnly `rateo_token` cookie. Client code therefore
 * sees `ClientAuthResponse`.
 */
export type LoginResponse = User & { token: string };

export type ClientAuthResponse = Omit<LoginResponse, 'token'>;

export type SessionResponse = { authenticated: boolean; role: Role | null };

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export type Notification = {
  _id: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  data?: Record<string, unknown>;
  createdAt?: string;
};

export type NotificationsResponse = Notification[] | { notifications: Notification[] };
