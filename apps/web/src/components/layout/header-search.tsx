"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import { useEffect, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/field";

/** The search field under the header: a plain GET form to the catalog, so "limón" becomes `/products?search=lim%C3%B3n`. */
export function HeaderSearchForm({ inputRef, onKeyDown }: { inputRef?: Ref<HTMLInputElement>; onKeyDown?: (event: KeyboardEvent<HTMLFormElement>) => void }) {
  return (
    <form
      id="header-search"
      action="/products"
      role="search"
      onKeyDown={onKeyDown}
      className="absolute inset-x-0 top-full border-b border-line bg-surface px-4 py-3 shadow-soft sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl gap-2">
        <label htmlFor="header-search-input" className="sr-only">
          Buscar productos
        </label>
        <Input ref={inputRef} id="header-search-input" type="search" name="search" maxLength={MAX_SEARCH_LENGTH} placeholder="Buscar productos…" />
        <IconButton type="submit" label="Buscar productos" icon={<MagnifyingGlass />} />
      </div>
    </form>
  );
}

/**
 * Header search (RF-24): the icon opens a field under the header; submitting goes to
 * `/products?search=…` with a plain GET form (the catalog reads the URL). Escape closes it and gives
 * the focus back to the icon.
 */
export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    toggleRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") close();
  }

  return (
    <>
      <IconButton
        ref={toggleRef}
        label={isOpen ? "Cerrar búsqueda" : "Buscar"}
        icon={isOpen ? <X /> : <MagnifyingGlass />}
        aria-expanded={isOpen}
        aria-controls="header-search"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
      />
      {isOpen && <HeaderSearchForm inputRef={inputRef} onKeyDown={handleKeyDown} />}
    </>
  );
}
