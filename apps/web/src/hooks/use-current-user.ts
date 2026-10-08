"use client";

import type { AuthUser } from "@portal/shared/auth";
import useSWR from "swr";
import { CURRENT_USER_KEY, fetchCurrentUser } from "@/lib/auth-client";

/** The logged-in user (null without a session), shared by every component through the SWR cache. */
export function useCurrentUser() {
  return useSWR<AuthUser | null, Error>(CURRENT_USER_KEY, fetchCurrentUser);
}
