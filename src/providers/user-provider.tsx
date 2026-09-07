"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types/api";

const UserContext = createContext<User | null>(null);

/**
 * Makes the server-fetched user available to client components and seeds the
 * `['me']` query cache so `useMe()` renders instantly without a second fetch.
 */
export function UserProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const seeded = useRef<boolean | null>(null);

  // Seed on the first render (before children mount) so `useMe()` never
  // observes an empty cache; refresh it whenever the server sends a new user.
  if (seeded.current == null) {
    seeded.current = true;
    queryClient.setQueryData(["me"], user);
  }

  useEffect(() => {
    queryClient.setQueryData(["me"], user);
  }, [queryClient, user]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** The current user. Only valid inside the (dashboard) / (setup) layouts. */
export function useUser(): User {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used inside <UserProvider>");
  }
  return user;
}
