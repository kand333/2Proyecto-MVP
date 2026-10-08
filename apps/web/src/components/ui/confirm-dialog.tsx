"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ConfirmOptions = {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  /** `danger`: irreversible or sensitive actions (red button). */
  tone?: "default" | "danger";
};

type ConfirmRequest = ConfirmOptions & { resolve: (confirmed: boolean) => void };

type ConfirmDialogProps = { request: ConfirmRequest | null; onClose: (confirmed: boolean) => void };

/**
 * Modal warning built on the native <dialog>: showModal() traps the focus, makes the rest of the page
 * inert and closes with Escape. «Cancelar» comes first, so it gets the initial focus.
 */
export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request && !dialog.open) dialog.showModal();
    if (!request && dialog.open) dialog.close();
  }, [request]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      // Escape: the browser cancels the dialog; we answer «no».
      onCancel={(event) => {
        event.preventDefault();
        onClose(false);
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[1.25rem] border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      {request && (
        <div className="p-6">
          <h2 id={titleId} className="font-display text-2xl font-semibold tracking-tight">
            {request.title}
          </h2>
          <div id={messageId} className="mt-3 text-sm leading-relaxed text-muted">
            {request.message}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="h-11 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onClose(true)}
              className={cn(
                "h-11 rounded-full px-5 text-sm font-semibold transition-colors duration-200",
                request.tone === "danger"
                  ? "bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500"
                  : "bg-accent text-on-accent hover:bg-accent-hover",
              )}
            >
              {request.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/**
 * `await confirm({...})` instead of window.confirm: resolves true when the user accepts.
 * Render `dialog` once in the component that calls it.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  );
  const close = useCallback(
    (confirmed: boolean) => {
      request?.resolve(confirmed);
      setRequest(null);
    },
    [request],
  );
  return { confirm, dialog: <ConfirmDialog request={request} onClose={close} /> };
}
