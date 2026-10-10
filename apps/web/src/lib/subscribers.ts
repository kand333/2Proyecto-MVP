import { SUBSCRIBE_POPUP_STORAGE_KEY } from "@portal/shared/app-config";
import type { SubscribeResponse } from "@portal/shared/subscriber";
import { postJson } from "./api-client";

/** Subscribes with marketing consent and returns the welcome code (the same one for an email already subscribed). */
export const subscribe = (email: string) => postJson<SubscribeResponse>("/api/subscribers", { email, marketingConsent: true });

/** Seconds on the site before the popup appears (RF-12). */
export const POPUP_DELAY_MS = 10_000;

let seenInMemory = false;

/** Whether this browser already saw the popup (closed or subscribed). Storage may be blocked: then it lasts for the page. */
export function hasSeenSubscribePopup(): boolean {
  if (seenInMemory) return true;
  try {
    return localStorage.getItem(SUBSCRIBE_POPUP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSubscribePopupSeen(): void {
  seenInMemory = true;
  try {
    localStorage.setItem(SUBSCRIBE_POPUP_STORAGE_KEY, "1");
  } catch {
    // Storage blocked: remembered only for this page.
  }
}

/** Tests only. */
export function resetSubscribePopup(): void {
  seenInMemory = false;
}
