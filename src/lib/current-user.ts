import { cache } from "react";
import { getCurrentUser } from "@/lib/api/server";

/**
 * Request-scoped memo around the infra layer's `getCurrentUser()`, so nested
 * layouts (dashboard shell + per-role guards) share a single `/auth/profile`
 * round-trip. React `cache()` is per-request on the server.
 */
export const getCachedUser = cache(getCurrentUser);
