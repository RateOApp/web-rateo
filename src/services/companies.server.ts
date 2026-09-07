import { serverFetch, type ServerFetchInit } from '@/lib/api/server';
import { companyListQuery, toSearchString, type CompanyListParams } from '@/services/params';
import {
  normaliseReviews,
  type Review,
  type ReviewsResponse,
  type User,
  type UsersResponse,
} from '@/types/api';

export type { CompanyListParams } from '@/services/params';

/**
 * RSC / route-handler company directory API. Split from `companiesService`
 * because `@/lib/api/server` imports `server-only`.
 */
export const companiesServer = {
  list(params: CompanyListParams = {}, init?: ServerFetchInit): Promise<UsersResponse> {
    return serverFetch<UsersResponse>(`users${toSearchString(companyListQuery(params))}`, init);
  },

  byId(id: string, init?: ServerFetchInit): Promise<User> {
    return serverFetch<User>(`users/${id}`, init);
  },

  async reviews(id: string, init?: ServerFetchInit): Promise<Review[]> {
    return normaliseReviews(await serverFetch<ReviewsResponse>(`reviews/${id}`, init));
  },
};
