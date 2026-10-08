"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";

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
      className="m-auto w-[min(28rem,calc(100vw-2rem))] overscroll-contain rounded-xl border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
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
            <Button variant="secondary" onClick={() => onClose(false)}>
              Cancelar
            </Button>
            <Button variant={request.tone === "danger" ? "danger" : "primary"} onClick={() => onClose(true)}>
              {request.confirmLabel}
            </Button>
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
