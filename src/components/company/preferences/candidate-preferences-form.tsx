"use client";

import { useState } from "react";
import { Loader2, Plus, Star, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COMPANY_PREFERENCES_KEY,
  useCompanyPreferences,
} from "@/hooks/use-company-preferences";
import { getApiErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { candidatesService } from "@/services/candidates";
import {
  CANDIDATE_LOCATIONS,
  DEFAULT_CANDIDATE_PREFERENCES,
  type CandidatePreferences,
} from "@/types/candidates";

const MAX_STARS = 5;

/**
 * Candidate preferences: the location, minimum rating and roles the company
 * wants to see in its candidate feed (`computeCandidateMatch` reads all three).
 */
export function CandidatePreferencesForm() {
  const queryClient = useQueryClient();
  const query = useCompanyPreferences();

  const [location, setLocation] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [roles, setRoles] = useState<string[] | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed from the server exactly once, without an effect: the local value stays
  // `null` until the query resolves, then the user's edits take over.
  const saved: CandidatePreferences = query.data ?? {};
  const currentLocation =
    location ?? saved.location?.trim() ?? DEFAULT_CANDIDATE_PREFERENCES.location;
  const currentMinRating =
    minRating ??
    (typeof saved.minRating === "number"
      ? saved.minRating
      : DEFAULT_CANDIDATE_PREFERENCES.minRating);
  const currentRoles = roles ?? (Array.isArray(saved.roles) ? saved.roles : []);

  function addRole() {
    const value = draft.trim();
    if (!value || currentRoles.includes(value)) {
      setDraft("");
      return;
    }
    setRoles([...currentRoles, value]);
    setDraft("");
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const next = await candidatesService.updatePreferences({
        location: currentLocation,
        minRating: currentMinRating,
        roles: currentRoles,
      });
      queryClient.setQueryData(COMPANY_PREFERENCES_KEY, next);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Preferences updated successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update preferences"));
    } finally {
      setSaving(false);
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-48 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {/* ---- location ---------------------------------------------------- */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="candidate-location">Candidate Location</Label>
        <Select value={currentLocation} onValueChange={setLocation}>
          <SelectTrigger id="candidate-location" className="h-11 w-full bg-white">
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent>
            {CANDIDATE_LOCATIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ---- minimum rating ---------------------------------------------- */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-brand-900">
          Minimum applicant rating
        </legend>
        <div className="flex items-center gap-2">
          {Array.from({ length: MAX_STARS }, (_, index) => index + 1).map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star === 1 ? "" : "s"} minimum`}
              aria-pressed={star <= currentMinRating}
              onClick={() => setMinRating(star)}
              className="rounded p-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Star
                aria-hidden="true"
                className={cn(
                  "size-8",
                  star <= currentMinRating ? "fill-star text-star" : "text-gray-400",
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      {/* ---- roles -------------------------------------------------------- */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="candidate-role">Add a role</Label>
        <div className="flex gap-2">
          <Input
            id="candidate-role"
            value={draft}
            placeholder="Type a role or skill"
            className="h-11 bg-white"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addRole();
              }
            }}
          />
          <Button
            type="button"
            size="lg"
            className="h-11 shrink-0 bg-brand-700 px-5 text-white"
            onClick={addRole}
          >
            <Plus aria-hidden="true" />
            Add
          </Button>
        </div>

        {currentRoles.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {currentRoles.map((role) => (
              <li
                key={role}
                className="flex items-center gap-1 rounded-full bg-brand-50 py-1 pr-1 pl-3 text-sm font-medium text-brand-700"
              >
                {role}
                <button
                  type="button"
                  aria-label={`Remove ${role}`}
                  onClick={() => setRoles(currentRoles.filter((entry) => entry !== role))}
                  className="rounded-full p-1 transition-colors hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 bg-brand-700 text-white sm:self-start sm:px-10"
        disabled={saving}
      >
        {saving ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
        Save Changes
      </Button>
    </form>
  );
}
