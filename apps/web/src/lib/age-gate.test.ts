import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confirmAge, hasConfirmedAge, resetAgeGate, subscribeAgeGate } from "./age-gate";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

const throwingStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

beforeEach(() => {
  resetAgeGate();
  vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe("age gate", () => {
  it("asks a new visitor and remembers the answer in this browser", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    expect(hasConfirmedAge()).toBe(false);

    const listener = vi.fn();
    subscribeAgeGate(listener);
    confirmAge();
    expect(listener).toHaveBeenCalledOnce();
    expect(hasConfirmedAge()).toBe(true);

    // A later visit (fresh module state) reads it back from storage.
    resetAgeGate();
    expect(hasConfirmedAge()).toBe(true);
    expect(storage.getItem("terpenex:age-confirmed")).toBe("1");
  });

  it("keeps working when storage is blocked, remembering the answer for this page only", () => {
    vi.stubGlobal("localStorage", throwingStorage);
    expect(hasConfirmedAge()).toBe(false);
    expect(() => confirmAge()).not.toThrow();
    expect(hasConfirmedAge()).toBe(true);
  });

  it("stops notifying after unsubscribing", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    const listener = vi.fn();
    subscribeAgeGate(listener)();
    confirmAge();
    expect(listener).not.toHaveBeenCalled();
  });
});
