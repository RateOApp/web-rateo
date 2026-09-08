'use client';

import { useState } from 'react';

import { CompanyRatingTab } from '@/components/company/ratings/company-rating-tab';
import { RateEmployeesTab } from '@/components/company/ratings/rate-employees-tab';
import { PageContainer } from '@/components/layout/page-container';
import { CardListSkeleton } from '@/components/shared/card-list-skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMe } from '@/hooks/use-me';
import { useParticipationStatus } from '@/hooks/use-participation';
import { useUserReviews } from '@/hooks/use-reviews';
import type { User } from '@/types/api';

/**
 * `/dashboard/ratings` for companies: how their staff rate them, and the staff
 * they still owe a rating to.
 *
 * The two tabs are the two halves of the same obligation - a company that stops
 * rating its employees stops seeing their comments, because participation gates
 * both - so they live on one screen rather than one being buried in the roster.
 */
export function CompanyRatings({ user: initialUser }: { user: User }) {
  const [tab, setTab] = useState('company');
  const { data } = useMe();
  const user = data ?? initialUser;

  const reviews = useUserReviews(user._id);
  const participation = useParticipationStatus();

  return (
    <PageContainer>
      <PageHeader
        title="Ratings"
        description="Your company rating and the ratings you give your team."
      />

      {!user._id ? (
        <CardListSkeleton rows={3} />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="company">Company Rating</TabsTrigger>
            <TabsTrigger value="employees">Rate Employees</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-4">
            <CompanyRatingTab
              company={user}
              summary={reviews.data}
              isLoading={reviews.isPending}
              participationScore={
                typeof participation.data?.participationScore === 'number'
                  ? participation.data.participationScore
                  : null
              }
              participationStatus={participation.data?.participationStatus ?? null}
            />
          </TabsContent>

          <TabsContent value="employees" className="mt-4">
            <RateEmployeesTab />
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}
