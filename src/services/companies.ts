import { api } from '@/lib/api/client';
import { companyListQuery, type CompanyListParams } from '@/services/params';
import { normaliseReviews, type Review, type ReviewsResponse, type User, type UsersResponse } from '@/types/api';

export type { CompanyListParams } from '@/services/params';
export { normaliseReviews } from '@/types/api';

/**
 * Browser-side company directory API. The RSC equivalent is `companiesServer`
 * in `@/services/companies.server`.
 *
 * Companies are just users with `role=company`; `GET /company/:id` is
 * admin-only and must not be used here.
 */
export const companiesService = {
  list(params: CompanyListParams = {}): Promise<UsersResponse> {
    return api
      .get<UsersResponse>('/users', { params: companyListQuery(params) })
      .then((r) => r.data);
  },

  byId(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`).then((r) => r.data);
  },

  reviews(id: string): Promise<Review[]> {
    return api.get<ReviewsResponse>(`/reviews/${id}`).then((r) => normaliseReviews(r.data));
  },
};
