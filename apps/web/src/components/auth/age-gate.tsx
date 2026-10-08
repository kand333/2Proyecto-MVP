"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { confirmAge, hasConfirmedAge, subscribeAgeGate } from "@/lib/age-gate";

export const AGE_RESTRICTED_PATH = "/age-restricted";

/**
 * The notice itself: a native modal <dialog> (showModal() traps the focus and makes the page
 * inert). It cannot be dismissed with Escape: the visitor has to answer.
 */
export function AgeGateDialog({ onConfirm }: { onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-message"
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] overscroll-contain rounded-xl border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-paper/90 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <h2 id="age-gate-title" className="font-display text-2xl font-semibold tracking-tight">
          Solo para mayores de 18 años
        </h2>
        <p id="age-gate-message" className="mt-3 leading-relaxed text-muted">
          Esta tienda vende productos con nicotina y accesorios para adultos. Para entrar, confirma que tienes 18 años o
          más.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href={AGE_RESTRICTED_PATH} className={buttonClassName("secondary")}>
            Soy menor
          </Link>
          <Button onClick={onConfirm}>Soy mayor de 18</Button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Age notice of the public site (RF-04). Only UX: the API refuses minors (DEC-008). Nothing is
 * rendered on the server, so adults who already answered never see it flash.
 */
export function AgeGate() {
  const pathname = usePathname();
  const isConfirmed = useSyncExternalStore(subscribeAgeGate, hasConfirmedAge, () => true);

  if (isConfirmed || pathname === AGE_RESTRICTED_PATH) return null;
  return <AgeGateDialog onConfirm={confirmAge} />;
}
