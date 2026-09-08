'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api/errors';
import { companyEmployeesService } from '@/services/company-employees';
import type { EmployeeRequest, VerifyEmployeeAction } from '@/types/company';

/**
 * A pending "I work here" claim.
 *
 * Approving is not a formality: it makes this company the individual's current
 * employer, ends any other current employment they had, and starts counting
 * both parties' monthly ratings. Both buttons lock while either is in flight -
 * a double tap used to fire `verify` twice and send the employee two
 * notifications.
 */
export function RequestRow({ request }: { request: EmployeeRequest }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<VerifyEmployeeAction | null>(null);

  const name = request.name?.trim() || 'Someone';

  async function verify(action: VerifyEmployeeAction) {
    if (pending) return;
    setPending(action);
    try {
      await companyEmployeesService.verify(request.id, action);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['companyEmployees'] }),
        queryClient.invalidateQueries({ queryKey: ['terminatedEmployees'] }),
      ]);
      router.refresh();
      toast.success(action === 'approve' ? 'Request Approved' : 'Request Rejected', {
        description:
          action === 'approve' ? 'Employee added successfully.' : 'Request rejected.',
      });
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Failed to process request'));
    } finally {
      setPending(null);
    }
  }

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
      <UserAvatar user={{ firstName: name, avatar: request.avatar }} className="size-11" />

      <p className="min-w-0 flex-1 text-sm text-muted-foreground">
        <span className="font-semibold text-brand-900">{name}</span>{' '}
        {request.status?.trim() || "says they're part of your company"}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Confirm ${name}`}
          disabled={pending !== null}
          onClick={() => void verify('approve')}
          className="text-brand-700"
        >
          {pending === 'approve' ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Check aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Reject ${name}`}
          disabled={pending !== null}
          onClick={() => void verify('reject')}
          className="text-muted-foreground"
        >
          {pending === 'reject' ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <X aria-hidden="true" />
          )}
        </Button>
      </div>
    </article>
  );
}
