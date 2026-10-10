import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addToCart, clearCart, countUnits, readCart, removeFromCart, resetCart, sanitizeCart, setCartQuantity, subscribeCart } from "./cart";

const A = "0190a4f2-7c1e-7d3a-9b2f-4c5d6e7f8a9b";
const B = "0190a4f2-7c1e-7d3a-9b2f-4c5d6e7f8a9c";
const KEY = "terpenex:cart";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

beforeEach(() => {
  resetCart();
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser cart", () => {
  it("adds a variant, sums repeated adds up to 10 and survives a reload", () => {
    addToCart(A);
    addToCart(A, 3);
    addToCart(B);
    expect(readCart()).toEqual([
      { variantId: A, quantity: 4 },
      { variantId: B, quantity: 1 },
    ]);
    addToCart(A, 20);
    expect(readCart()[0]?.quantity).toBe(10);
    expect(JSON.parse(localStorage.getItem(KEY) ?? "[]")).toHaveLength(2);

    resetCart(); // a reload: memory is gone, storage stays
    expect(readCart()).toEqual([
      { variantId: A, quantity: 10 },
      { variantId: B, quantity: 1 },
    ]);
  });

  it("changes quantities within 1-10, removes and clears lines, and counts units", () => {
    addToCart(A, 2);
    addToCart(B, 3);
    setCartQuantity(A, 0);
    expect(readCart()[0]?.quantity).toBe(1);
    expect(countUnits(readCart())).toBe(4);
    removeFromCart(B);
    expect(readCart()).toEqual([{ variantId: A, quantity: 1 }]);
    clearCart();
    expect(readCart()).toEqual([]);
  });

  it("keeps the same reference while nothing changes and tells subscribers about changes", () => {
    const listener = vi.fn();
    subscribeCart(listener);
    addToCart(A);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(readCart()).toBe(readCart());
  });

  it("ignores broken or foreign data in storage", () => {
    localStorage.setItem(KEY, "{not json");
    expect(readCart()).toEqual([]);
    expect(sanitizeCart([{ variantId: A, quantity: 2.7 }, { variantId: A, quantity: 1 }, { variantId: "x", quantity: 1 }, null, { variantId: B, quantity: 99 }])).toEqual([
      { variantId: A, quantity: 2 },
      { variantId: B, quantity: 10 },
    ]);
  });

  it("keeps the cart in memory when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readCart()).toEqual([]);
    addToCart(A, 2);
    expect(readCart()).toEqual([{ variantId: A, quantity: 2 }]);
  });
});
