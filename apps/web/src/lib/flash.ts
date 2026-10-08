/**
 * Flash messages: short notices of what just happened (logged in, saved, deleted…), shown at the
 * top of the page by `FlashMessages` and gone after a few seconds. A small store shared by every
 * component; pending messages are kept in sessionStorage, so a notice survives a full page load
 * (e.g. right after logging out) but never other tabs or later visits.
 */

import { FLASH_STORAGE_KEY } from "@portal/shared/app-config";

export type FlashTone = "success" | "info" | "error";
export type FlashMessage = { id: string; tone: FlashTone; text: string };

export const FLASH_DURATION_MS = 5000;
const STORAGE_KEY = FLASH_STORAGE_KEY;
const NO_MESSAGES: FlashMessage[] = [];

let messages: FlashMessage[] = NO_MESSAGES;
let isLoaded = false;
const listeners = new Set<() => void>();

function readStorage(): FlashMessage[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? (stored as FlashMessage[]) : NO_MESSAGES;
  } catch {
    return NO_MESSAGES;
  }
}

function setMessages(next: FlashMessage[]) {
  messages = next;
  try {
    if (next.length > 0) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the notice still shows on this page.
  }
  listeners.forEach((listener) => listener());
}

function ensureLoaded() {
  if (isLoaded || typeof window === "undefined") return;
  isLoaded = true;
  const stored = readStorage();
  if (stored.length > 0) messages = stored;
}

/** Shows a notice at the top of the page. Repeating the same text replaces the previous one. */
export function flash(text: string, tone: FlashTone = "success"): void {
  ensureLoaded();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  setMessages([...messages.filter((message) => message.text !== text), { id, tone, text }]);
}

export function dismissFlash(id: string): void {
  ensureLoaded();
  setMessages(messages.filter((message) => message.id !== id));
}

export function subscribeFlash(listener: () => void): () => void {
  listeners.add(listener);
  // Messages left by the previous page appear once the client is running (never during hydration).
  if (!isLoaded) {
    ensureLoaded();
    if (messages.length > 0) queueMicrotask(listener);
  }
  return () => listeners.delete(listener);
}

export const getFlashSnapshot = (): FlashMessage[] => messages;
/** The server (and hydration) render no notices. */
export const getFlashServerSnapshot = (): FlashMessage[] => NO_MESSAGES;

/** Tests only. */
export function resetFlash(): void {
  messages = NO_MESSAGES;
  isLoaded = false;
  listeners.clear();
}
