import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dismissFlash, flash, getFlashServerSnapshot, getFlashSnapshot, resetFlash, subscribeFlash } from "./flash";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

beforeEach(() => {
  resetFlash();
  vi.stubGlobal("window", {});
  vi.stubGlobal("sessionStorage", memoryStorage());
});
afterEach(() => vi.unstubAllGlobals());

describe("flash messages", () => {
  it("adds notices (success by default), notifies subscribers and dismisses them", () => {
    const listener = vi.fn();
    subscribeFlash(listener);
    flash("Sesión iniciada.");
    flash("No pudimos guardar.", "error");
    expect(getFlashSnapshot().map(({ tone, text }) => [tone, text])).toEqual([
      ["success", "Sesión iniciada."],
      ["error", "No pudimos guardar."],
    ]);
    expect(listener).toHaveBeenCalledTimes(2);

    dismissFlash(getFlashSnapshot()[0]!.id);
    expect(getFlashSnapshot().map((message) => message.text)).toEqual(["No pudimos guardar."]);
  });

  it("shows the same text once, as the newest notice", () => {
    flash("Guardado.");
    flash("Otro.");
    flash("Guardado.");
    expect(getFlashSnapshot().map((message) => message.text)).toEqual(["Otro.", "Guardado."]);
  });

  it("keeps pending notices across a full page load, and forgets the dismissed ones", async () => {
    flash("Sesión cerrada.");
    // A new page: the store starts empty and reads what the previous page left.
    resetFlash();
    const listener = vi.fn();
    subscribeFlash(listener);
    await Promise.resolve();
    expect(getFlashSnapshot().map((message) => message.text)).toEqual(["Sesión cerrada."]);
    expect(listener).toHaveBeenCalled();

    dismissFlash(getFlashSnapshot()[0]!.id);
    resetFlash();
    subscribeFlash(() => undefined);
    expect(getFlashSnapshot()).toEqual([]);
  });

  it("renders no notices on the server, so hydration always matches", () => {
    flash("Algo.");
    expect(getFlashServerSnapshot()).toEqual([]);
  });
});
