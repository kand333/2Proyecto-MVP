"use client";

import { X } from "@phosphor-icons/react/ssr";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import {
  dismissFlash,
  FLASH_DURATION_MS,
  getFlashServerSnapshot,
  getFlashSnapshot,
  subscribeFlash,
  type FlashMessage,
  type FlashTone,
} from "@/lib/flash";

const toneClassNames: Record<FlashTone, string> = {
  success: "border-emerald-600/40 dark:border-emerald-400/40",
  info: "border-accent/50",
  error: "border-red-400/60 dark:border-red-800",
};

const dotClassNames: Record<FlashTone, string> = {
  success: "bg-emerald-600 dark:bg-emerald-400",
  info: "bg-accent",
  error: "bg-red-600 dark:bg-red-400",
};

export function FlashItem({ message }: { message: FlashMessage }) {
  // Each notice goes away on its own after a few seconds.
  useEffect(() => {
    const timer = setTimeout(() => dismissFlash(message.id), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message.id]);

  return (
    <li
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-surface py-3 pl-4 pr-2 text-sm text-ink shadow-lift animate-[flash-in_0.25s_ease-out]",
        toneClassNames[message.tone],
      )}
    >
      <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotClassNames[message.tone])} />
      <p className="min-w-0 flex-1 break-words py-0.5 font-medium">{message.text}</p>
      <button
        type="button"
        onClick={() => dismissFlash(message.id)}
        aria-label="Cerrar aviso"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-paper hover:text-ink"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

/** Notices of what just happened, at the top of every page (site and admin); closable, gone after 5 s. */
export function FlashMessages() {
  const messages = useSyncExternalStore(subscribeFlash, getFlashSnapshot, getFlashServerSnapshot);

  return (
    // Always in the page, so screen readers announce each notice as it is added.
    <div aria-live="polite" aria-label="Avisos" role="region" className="pointer-events-none fixed inset-x-0 top-3 z-[1100] flex justify-center px-4">
      <ul className="flex w-full max-w-md flex-col gap-2">
        {messages.map((message) => (
          <FlashItem key={message.id} message={message} />
        ))}
      </ul>
    </div>
  );
}
