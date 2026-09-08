"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { FormAlert } from "@/components/auth/form-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import { describedBy, FieldShell, TextField } from "@/components/auth/text-field";
import { DeadlinePicker } from "@/components/company/jobs/deadline-picker";
import {
  formatSalaryInput,
  jobFormSchema,
  REQUIRED_FIELDS_MESSAGE,
  type JobFormValues,
} from "@/components/company/jobs/job-form-schema";
import { RatingPicker } from "@/components/company/jobs/rating-picker";
import { SkillsPicker } from "@/components/company/jobs/skills-picker";
import { SuggestInput } from "@/components/setup/suggest-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INDUSTRIES } from "@/lib/constants/industries";
import {
  GENDER_OPTIONS,
  JOB_LOCATIONS,
  JOB_TYPES,
  todayInputValue,
  WORK_ARRANGEMENTS,
} from "@/lib/constants/jobs";
import { cn } from "@/lib/utils";

export type JobFormMode = "create" | "edit";

/** The extra location entry that swaps the select for a free-text field. */
const OTHER_LOCATION = "Other (type it myself)";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      <h2 className="text-base font-bold text-brand-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/**
 * The job form, shared by Post and Edit.
 *
 * Edit adds the Open/Closed status control and whatever `footer` the caller
 * passes (the delete button). Field order matches `docs/COMPANY_DASHBOARD.md`
 * -> "Post", which in turn matches the mobile screen, so a company answers the
 * same questions in the same order on both.
 */
export function JobForm({
  mode,
  defaultValues,
  earliestDeadline,
  submitLabel,
  pendingLabel,
  serverError,
  onSubmit,
  footer,
}: {
  mode: JobFormMode;
  defaultValues: JobFormValues;
  earliestDeadline?: string;
  submitLabel: string;
  pendingLabel: string;
  serverError: string | null;
  onSubmit: (values: JobFormValues) => Promise<void> | void;
  footer?: React.ReactNode;
}) {
  const minDate = earliestDeadline ?? todayInputValue();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema(minDate)),
    defaultValues,
  });

  const [industryQuery, setIndustryQuery] = useState(defaultValues.category);
  const [customLocation, setCustomLocation] = useState(
    () => !(JOB_LOCATIONS as readonly string[]).includes(defaultValues.location),
  );

  const industrySuggestions = useMemo(() => {
    const needle = industryQuery.trim().toLowerCase();
    if (!needle) return INDUSTRIES;
    return INDUSTRIES.filter((entry) => entry.toLowerCase().includes(needle));
  }, [industryQuery]);

  // The three fields the mobile alert names share one line so its copy stays
  // verbatim; everything else speaks through its own field error.
  const requiredMissing = Boolean(errors.title || errors.description || errors.location);
  const alert =
    serverError ??
    (requiredMissing ? REQUIRED_FIELDS_MESSAGE : (errors.category?.message ?? null));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Section title="The role" description="What you are hiring for, and where.">
        <TextField
          id="job-title"
          label="Job title"
          placeholder="e.g. Software Engineer"
          error={errors.title?.message}
          {...register("title")}
        />

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <FieldShell id="job-type" label="Job type" error={errors.type?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="job-type" className="h-11 w-full">
                  <SelectValue placeholder="Select a job type" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <FieldShell id="job-industry" label="Job industry" error={errors.category?.message}>
              <SuggestInput
                id="job-industry"
                value={industryQuery}
                onValueChange={(value) => {
                  setIndustryQuery(value);
                  field.onChange(value);
                }}
                onSelect={(entry) => {
                  setIndustryQuery(entry);
                  field.onChange(entry);
                }}
                items={industrySuggestions}
                itemKey={(entry) => entry}
                renderItem={(entry) => entry}
                placeholder="Select industry"
                invalid={Boolean(errors.category)}
                describedBy={describedBy("job-industry", errors.category?.message)}
              />
            </FieldShell>
          )}
        />

        <Controller
          control={control}
          name="workArrangement"
          render={({ field }) => (
            <FieldShell
              id="job-arrangement"
              label="Work arrangement"
              error={errors.workArrangement?.message}
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="job-arrangement" className="h-11 w-full">
                  <SelectValue placeholder="Select a work arrangement" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_ARRANGEMENTS.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          )}
        />

        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <FieldShell id="job-location" label="Location" error={errors.location?.message}>
              <div className="flex flex-col gap-2">
                <Select
                  value={customLocation ? OTHER_LOCATION : field.value}
                  onValueChange={(value) => {
                    if (value === OTHER_LOCATION) {
                      setCustomLocation(true);
                      field.onChange("");
                      return;
                    }
                    setCustomLocation(false);
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger id="job-location" className="h-11 w-full">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_LOCATIONS.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {entry}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_LOCATION}>{OTHER_LOCATION}</SelectItem>
                  </SelectContent>
                </Select>

                {customLocation ? (
                  <Input
                    id="job-location-custom"
                    value={field.value}
                    placeholder="Type a location"
                    aria-label="Custom location"
                    aria-invalid={errors.location ? true : undefined}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="h-11"
                  />
                ) : null}
              </div>
            </FieldShell>
          )}
        />
      </Section>

      <Section title="Who you want" description="Skills, preferences and the rating bar.">
        <FieldShell id="job-skill" label="Skills">
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <SkillsPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>

        <Controller
          control={control}
          name="genderPreference"
          render={({ field }) => (
            <FieldShell
              id="job-gender"
              label="Preferred gender"
              below={
                <p className="text-xs text-muted-foreground">
                  Optional &mdash; shown on the job listing.
                </p>
              }
            >
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="job-gender" className="h-11 w-full">
                  <SelectValue placeholder="Both" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((entry) => (
                    <SelectItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          )}
        />

        <FieldShell id="job-min-rating" label="Minimum applicant rating" optional>
          <Controller
            control={control}
            name="minRating"
            render={({ field }) => (
              <RatingPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>
      </Section>

      <Section title="Package" description="Leave the salary blank to show Negotiable.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="minSalary"
            render={({ field }) => (
              <SalaryField
                id="job-min-salary"
                label="Min. salary"
                placeholder="100,000"
                value={field.value}
                onChange={field.onChange}
                error={errors.minSalary?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="maxSalary"
            render={({ field }) => (
              <SalaryField
                id="job-max-salary"
                label="Max. salary"
                placeholder="1,000,000"
                value={field.value}
                onChange={field.onChange}
                error={errors.maxSalary?.message}
              />
            )}
          />
        </div>

        <Controller
          control={control}
          name="deadlineDate"
          render={({ field: dateField }) => (
            <Controller
              control={control}
              name="deadlineOption"
              render={({ field: optionField }) => (
                <DeadlinePicker
                  option={optionField.value}
                  date={dateField.value}
                  onOptionChange={optionField.onChange}
                  onDateChange={dateField.onChange}
                  minDate={minDate}
                  error={errors.deadlineDate?.message}
                />
              )}
            />
          )}
        />
      </Section>

      <Section title="The details" description="What the day-to-day looks like.">
        <FieldShell
          id="job-description"
          label="Job description"
          error={errors.description?.message}
        >
          <Textarea
            id="job-description"
            rows={6}
            placeholder="Tell candidates about the role, the team and what success looks like."
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={describedBy("job-description", errors.description?.message)}
            {...register("description")}
          />
        </FieldShell>

        <FieldShell
          id="job-tasks"
          label="Tasks"
          below={<p className="text-xs text-muted-foreground">One task per line.</p>}
        >
          <Textarea id="job-tasks" rows={5} {...register("tasks")} />
        </FieldShell>

        <FieldShell
          id="job-perks"
          label="Perks"
          optional
          below={<p className="text-xs text-muted-foreground">One perk per line.</p>}
        >
          <Textarea id="job-perks" rows={4} {...register("perks")} />
        </FieldShell>
      </Section>

      {mode === "edit" ? (
        <Section
          title="Status"
          description="Closed jobs stay in your list but stop taking applications."
        >
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Job status" className="flex gap-2">
                {(["open", "closed"] as const).map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    role="radio"
                    aria-checked={field.value === entry}
                    onClick={() => field.onChange(entry)}
                    className={cn(
                      "h-11 flex-1 rounded-xl border text-sm font-semibold capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      field.value === entry
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-border bg-card text-brand-900 hover:bg-muted",
                    )}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            )}
          />
        </Section>
      ) : null}

      <FormAlert>{alert}</FormAlert>

      <SubmitButton
        pending={isSubmitting}
        pendingLabel={pendingLabel}
        className="bg-brand-700 text-white"
      >
        {submitLabel}
      </SubmitButton>

      {footer}
    </form>
  );
}

function SalaryField({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
}) {
  return (
    <FieldShell id={id} label={label} optional error={error}>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-input px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <span aria-hidden="true" className="text-sm font-semibold text-brand-900">
          &#8358;
        </span>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error)}
          onChange={(event) => onChange(formatSalaryInput(event.target.value))}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </FieldShell>
  );
}
