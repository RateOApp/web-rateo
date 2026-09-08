"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StarRating } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { COMPANY_EMPLOYEES_KEY, useCompanyEmployees } from "@/hooks/use-company-employees";
import { getApiErrorMessage } from "@/lib/api/client";
import { candidatesService } from "@/services/candidates";
import type { VerifyEmployeeAction } from "@/types/candidates";

/**
 * Pending "I work here" claims, from `GET /users/company/employees` ->
 * `requests[]`. The mobile app pops these as a timed bottom sheet; on the web
 * they sit inline at the top of home, where nothing can be missed.
 *
 * Renders nothing when there is no pending request.
 */
export function ClaimRequests() {
  const queryClient = useQueryClient();
  const { requests } = useCompanyEmployees();
  const [pending, setPending] = useState<string | null>(null);

  async function handle(id: string, name: string, action: VerifyEmployeeAction) {
    if (pending) return;
    setPending(id);
    try {
      await candidatesService.verifyEmployee(id, action);
      void queryClient.invalidateQueries({ queryKey: COMPANY_EMPLOYEES_KEY });
      if (action === "approve") {
        toast.success("Request Approved", { description: "Employee added successfully." });
      } else {
        toast.success("Request Rejected", { description: "Request rejected." });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Could not ${action} ${name}`));
    } finally {
      setPending(null);
    }
  }

  if (!requests.length) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Employee requests
      </h2>

      <ul className="flex flex-col gap-3">
        {requests.map((request) => {
          const name = request.name?.trim() || "This person";
          const busy = pending === request.id;

          return (
            <li
              key={request.id}
              className="rounded-2xl border border-border bg-white p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={{ firstName: request.name, avatar: request.avatar }}
                  size="lg"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand-900">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    says they&rsquo;re part of your company
                  </p>
                  <StarRating value={request.rating ?? 0} size={16} className="mt-1" />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 bg-brand-700 text-white sm:flex-1"
                  disabled={busy}
                  onClick={() => void handle(request.id, name, "approve")}
                >
                  {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
                  Yes, confirm
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-11 text-muted-foreground sm:flex-1"
                  disabled={busy}
                  onClick={() => void handle(request.id, name, "reject")}
                >
                  Reject
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
