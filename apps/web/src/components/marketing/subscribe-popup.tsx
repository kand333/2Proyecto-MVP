"use client";

import { X } from "@phosphor-icons/react";
import { WELCOME_DISCOUNT_PERCENT } from "@portal/shared/subscriber";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AGE_RESTRICTED_PATH } from "@/components/auth/age-gate";
import { IconButton } from "@/components/ui/icon-button";
import { hasConfirmedAge, subscribeAgeGate } from "@/lib/age-gate";
import { POPUP_DELAY_MS, hasSeenSubscribePopup, markSubscribePopupSeen } from "@/lib/subscribers";
import { SubscribeForm } from "./subscribe-form";

/**
 * The popup itself: native modal <dialog> (focus trapped, Escape closes). Closing it in any way
 * hides it for good in this browser; the entrance animation is off with reduced motion (globals.css).
 */
export function SubscribeDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="subscribe-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] animate-[flash-in_200ms_ease-out] overscroll-contain rounded-lg border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-ink/50"
    >
      <div className="relative p-6 sm:p-8">
        <IconButton label="Cerrar" icon={<X />} onClick={onClose} className="absolute right-2 top-2" />
        <h2 id="subscribe-title" className="pr-10 font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight font-stretch-condensed">
          {WELCOME_DISCOUNT_PERCENT} % en tu primer pedido
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">Suscríbete y recibe tu código de bienvenida al instante.</p>
        <div className="mt-6">
          <SubscribeForm onSubscribed={markSubscribePopupSeen} />
        </div>
      </div>
    </dialog>
  );
}

/**
 * Subscription popup of the public site (RF-12): only after the age notice, 10 s after arriving, once
 * per browser. Nothing on the server render.
 */
export function SubscribePopup() {
  const pathname = usePathname();
  const ageConfirmed = useSyncExternalStore(subscribeAgeGate, hasConfirmedAge, () => false);
  const [isOpen, setIsOpen] = useState(false);
  const eligible = ageConfirmed && pathname !== AGE_RESTRICTED_PATH;

  useEffect(() => {
    if (!eligible || hasSeenSubscribePopup()) return;
    const timer = window.setTimeout(() => setIsOpen(true), POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [eligible]);

  if (!isOpen) return null;
  return (
    <SubscribeDialog
      onClose={() => {
        markSubscribePopupSeen();
        setIsOpen(false);
      }}
    />
  );
}
