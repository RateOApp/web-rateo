import { z } from "zod";

import { isIndustry } from "@/lib/constants/industries";
import {
  CUSTOM_DEADLINE_OPTION,
  DEFAULT_DEADLINE_OPTION,
  DEFAULT_JOB_SKILLS,
  deadlineFromOption,
  JOB_LOCATIONS,
  JOB_TYPES,
  toDateInputValue,
  toGenderOptionValue,
  todayInputValue,
  WORK_ARRANGEMENTS,
} from "@/lib/constants/jobs";
import type { Job } from "@/types/api";
import type { JobPayload } from "@/types/company-jobs";

/**
 * The alert shown above the submit button when the three hard-required fields
 * are missing. Verbatim from `PostJobScreen.handlePost` - the individual field
 * errors below are the web affordance, this line is the mobile copy.
 */
export const REQUIRED_FIELDS_MESSAGE =
  "Please fill in all required fields (Title, Description, Location)";

export const INDUSTRY_REQUIRED_MESSAGE = "Please choose the job industry.";

/** Digits and commas only, e.g. `1,000,000`. */
const SALARY_PATTERN = /^[\d,]*$/;

/** `"1,000,000" -> 1000000`; `undefined` when blank or unusable. */
export function parseSalary(value: string): number | undefined {
  const digits = value.replace(/,/g, "").trim();
  if (!digits) return undefined;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Re-groups a raw typed value into `1,000,000` while keeping it a string. */
export function formatSalaryInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number.parseInt(digits, 10).toLocaleString("en-NG");
}

/** One line per entry, blanks dropped - how `tasks` / `perks` are stored. */
function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * The form schema. Built per-mount because the earliest allowed deadline
 * differs: a new posting cannot close in the past, while an existing one may
 * already carry a past date that the company is not obliged to change.
 */
export function jobFormSchema(earliestDeadline: string = todayInputValue()) {
  return z
    .object({
      title: z.string().trim().min(1, "Please enter a job title."),
      type: z.string().trim().min(1, "Please choose a job type."),
      // The server validates `category` against the same canonical list, so a
      // free-text industry is rejected here rather than at the API.
      category: z
        .string()
        .trim()
        .min(1, INDUSTRY_REQUIRED_MESSAGE)
        // The `: boolean` is load-bearing: `isIndustry` is a type guard, and
        // without it TS infers one here too, narrowing `category` to the
        // literal union and forcing every caller to hold an `Industry`.
        .refine((value): boolean => isIndustry(value), "Please pick the industry from the list."),
      workArrangement: z.string().trim().min(1, "Please choose a work arrangement."),
      location: z.string().trim().min(1, "Please enter a location."),
      skills: z.array(z.string()),
      genderPreference: z.enum(["any", "male", "female"]),
      minSalary: z.string().regex(SALARY_PATTERN, "Use digits only, e.g. 100,000."),
      maxSalary: z.string().regex(SALARY_PATTERN, "Use digits only, e.g. 1,000,000."),
      deadlineOption: z.string(),
      deadlineDate: z.string(),
      description: z.string().trim().min(1, "Please enter a job description."),
      tasks: z.string(),
      perks: z.string(),
      minRating: z.number().int().min(0).max(5),
      status: z.enum(["open", "closed"]),
    })
    .superRefine((values, ctx) => {
      if (values.deadlineOption === CUSTOM_DEADLINE_OPTION) {
        if (!values.deadlineDate) {
          ctx.addIssue({
            code: "custom",
            path: ["deadlineDate"],
            message: "Please pick a deadline date.",
          });
        } else if (values.deadlineDate < earliestDeadline) {
          ctx.addIssue({
            code: "custom",
            path: ["deadlineDate"],
            message: "The deadline cannot be in the past.",
          });
        }
      }

      const min = parseSalary(values.minSalary);
      const max = parseSalary(values.maxSalary);
      if (min !== undefined && max !== undefined && max < min) {
        ctx.addIssue({
          code: "custom",
          path: ["maxSalary"],
          message: "The maximum salary cannot be lower than the minimum.",
        });
      }
    });
}

export type JobFormValues = z.infer<ReturnType<typeof jobFormSchema>>;

/**
 * Seeds the form. On edit the existing deadline is shown as the exact calendar
 * day it falls on (the mobile app rounds it back onto a preset, which silently
 * moves the date every time the job is saved).
 */
export function jobFormDefaults(
  job?: Job | null,
  fallbackIndustry?: string | null,
): JobFormValues {
  const deadlineDate = toDateInputValue(job?.deadline);

  return {
    title: job?.title ?? "",
    type: job?.type?.trim() || JOB_TYPES[0],
    category: job?.category?.trim() || fallbackIndustry?.trim() || "",
    workArrangement: job?.workArrangement?.trim() || WORK_ARRANGEMENTS[0],
    location: job?.location?.trim() || JOB_LOCATIONS[0],
    skills: job ? (job.skills ?? []) : [...DEFAULT_JOB_SKILLS],
    genderPreference: toGenderOptionValue(job?.genderPreference),
    minSalary: job?.minSalary != null ? formatSalaryInput(String(job.minSalary)) : "",
    maxSalary: job?.maxSalary != null ? formatSalaryInput(String(job.maxSalary)) : "",
    deadlineOption: deadlineDate ? CUSTOM_DEADLINE_OPTION : DEFAULT_DEADLINE_OPTION,
    deadlineDate,
    description: job?.description ?? "",
    tasks: job?.tasks?.join("\n") ?? "",
    perks: job?.perks?.join("\n") ?? "",
    minRating: job?.minRating ?? 0,
    status: job?.status === "closed" ? "closed" : "open",
  };
}

/** Form values -> the `POST /jobs` / `PUT /jobs/:id` body. */
export function toJobPayload(
  values: JobFormValues,
  options: { includeStatus?: boolean } = {},
): JobPayload {
  const minSalary = parseSalary(values.minSalary);
  const maxSalary = parseSalary(values.maxSalary);

  return {
    title: values.title.trim(),
    type: values.type,
    workArrangement: values.workArrangement,
    location: values.location.trim(),
    skills: values.skills,
    // Omitted when blank: `updateJob` falls back to the stored value for any
    // falsy field, so sending `0` would be meaningless anyway.
    ...(minSalary !== undefined ? { minSalary } : {}),
    ...(maxSalary !== undefined ? { maxSalary } : {}),
    description: values.description.trim(),
    tasks: toLines(values.tasks),
    perks: toLines(values.perks),
    deadline: deadlineFromOption(values.deadlineOption, values.deadlineDate),
    minRating: values.minRating,
    category: values.category.trim(),
    genderPreference: values.genderPreference,
    ...(options.includeStatus ? { status: values.status } : {}),
  };
}
